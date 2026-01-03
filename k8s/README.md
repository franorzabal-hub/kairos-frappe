# Kairos - Kubernetes Deployment (GKE)

## Arquitectura

```
                                    ┌─────────────┐
                                    │   Ingress   │
                                    │  (GCE LB)   │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      │
            ┌───────────────┐      ┌───────────────┐              │
            │   Frappe Web  │      │   SocketIO    │              │
            │   (Gunicorn)  │      │   (Node.js)   │              │
            │   x2-3 pods   │      │   x2 pods     │              │
            └───────┬───────┘      └───────┬───────┘              │
                    │                      │                      │
                    └──────────┬───────────┘                      │
                               │                                  │
        ┌──────────────────────┼──────────────────────┐          │
        │                      │                      │          │
        ▼                      ▼                      ▼          │
┌───────────────┐      ┌───────────────┐      ┌───────────────┐  │
│    Worker     │      │    Worker     │      │    Worker     │  │
│   (Default)   │      │   (Short)     │      │    (Long)     │  │
│   x2 pods     │      │   x1 pod      │      │   x1 pod      │  │
└───────────────┘      └───────────────┘      └───────────────┘  │
        │                      │                      │          │
        └──────────────────────┼──────────────────────┘          │
                               │                                  │
                       ┌───────┴───────┐                         │
                       │   Scheduler   │                         │
                       │   x1 pod      │                         │
                       └───────────────┘                         │
                               │                                  │
        ┌──────────────────────┼──────────────────────┐          │
        │                      │                      │          │
        ▼                      ▼                      ▼          │
┌───────────────┐      ┌───────────────┐      ┌───────────────┐  │
│  Redis Cache  │      │  Redis Queue  │      │    MariaDB    │  │
│   x1 pod      │      │   x1 pod      │      │   x1 pod      │  │
└───────────────┘      └───────────────┘      └───────────────┘  │
                                                      │          │
                               ┌──────────────────────┘          │
                               │                                  │
                               ▼                                  │
                       ┌───────────────┐                         │
                       │   PVC Sites   │◄────────────────────────┘
                       │   (Filestore) │
                       └───────────────┘
```

## Componentes

| Componente | Descripción | Réplicas |
|------------|-------------|----------|
| **frappe-web** | Servidor Gunicorn (HTTP) | 2-3 |
| **frappe-socketio** | WebSockets para real-time | 2 |
| **frappe-worker-default** | Jobs en cola default | 2 |
| **frappe-worker-short** | Jobs rápidos | 1 |
| **frappe-worker-long** | Jobs largos (backups, imports) | 1 |
| **frappe-scheduler** | Tareas programadas (cron) | 1 |
| **redis-cache** | Cache de datos | 1 |
| **redis-queue** | Cola de trabajos (RQ) | 1 |
| **mariadb** | Base de datos | 1 |

## Prerequisitos

1. **GKE Cluster** configurado
2. **kubectl** conectado al cluster
3. **Filestore** o storage class con RWX para `frappe-sites`
4. **IP estática** reservada para el Ingress

## Despliegue

### 1. Crear storage class RWX (si no existe)

```bash
# Opción A: GKE Filestore
gcloud filestore instances create kairos-filestore \
  --zone=us-central1-a \
  --tier=BASIC_HDD \
  --file-share=name=sites,capacity=10GB \
  --network=name=default

# Opción B: Usar NFS Provisioner
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/nfs-subdir-external-provisioner/master/deploy/deployment.yaml
```

### 2. Reservar IP estática

```bash
gcloud compute addresses create kairos-ip --global
```

### 3. Configurar secrets

```bash
# Editar secrets.yaml con valores reales
# O usar Google Secret Manager / Sealed Secrets
kubectl create secret generic frappe-secrets \
  --namespace=kairos \
  --from-literal=DB_ROOT_PASSWORD='YOUR_PASSWORD' \
  --from-literal=ADMIN_PASSWORD='YOUR_ADMIN_PASSWORD' \
  --dry-run=client -o yaml > k8s/base/secrets.yaml
```

### 4. Desplegar base

```bash
# Desde el directorio k8s/
kubectl apply -k base/

# Verificar pods
kubectl get pods -n kairos -w
```

### 5. Crear site inicial

```bash
# Editar job-create-site.yaml con el nombre del site
kubectl apply -f base/job-create-site.yaml

# Ver logs del job
kubectl logs -n kairos -l app.kubernetes.io/component=setup -f
```

### 6. Desplegar producción (overlay)

```bash
# Editar overlays/production/kustomization.yaml
# - Cambiar imagen a tu registry
# - Ajustar recursos según necesidad

kubectl apply -k overlays/production/
```

## Configuración

### Variables de entorno importantes

| Variable | Descripción | Default |
|----------|-------------|---------|
| `GUNICORN_WORKERS` | Workers de Gunicorn | 4 |
| `GUNICORN_THREADS` | Threads por worker | 4 |
| `REDIS_CACHE` | URL Redis cache | redis://redis-cache:6379 |
| `REDIS_QUEUE` | URL Redis queue | redis://redis-queue:6379 |
| `DB_HOST` | Host MariaDB | mariadb |

### Escalar componentes

```bash
# Escalar web pods
kubectl scale deployment frappe-web -n kairos --replicas=5

# Escalar workers
kubectl scale deployment frappe-worker-default -n kairos --replicas=4
```

## Monitoreo

### Logs

```bash
# Web logs
kubectl logs -n kairos -l app.kubernetes.io/component=web -f

# Worker logs
kubectl logs -n kairos -l app.kubernetes.io/component=worker -f

# Scheduler logs
kubectl logs -n kairos -l app.kubernetes.io/component=scheduler -f
```

### Health checks

```bash
# Check pods
kubectl get pods -n kairos

# Check services
kubectl get svc -n kairos

# Check ingress
kubectl get ingress -n kairos
kubectl describe ingress kairos-ingress -n kairos
```

## Backup & Restore

### Backup manual

```bash
kubectl exec -n kairos deployment/frappe-web -- \
  bench --site all backup --with-files
```

### Restore

```bash
kubectl exec -n kairos deployment/frappe-web -- \
  bench --site SITE_NAME restore /path/to/backup.sql.gz
```

## Troubleshooting

### Pod no inicia

```bash
# Ver eventos
kubectl describe pod POD_NAME -n kairos

# Ver logs del init container
kubectl logs POD_NAME -n kairos -c wait-for-db
```

### Error de permisos en PVC

```bash
# Verificar que el PVC está bound
kubectl get pvc -n kairos

# Verificar permisos (fsGroup debe ser 1000)
kubectl exec -n kairos deployment/frappe-web -- ls -la /home/frappe/frappe-bench/sites
```

### Conexión a DB fallida

```bash
# Verificar que MariaDB está corriendo
kubectl get pods -n kairos -l app.kubernetes.io/component=database

# Test de conexión
kubectl exec -n kairos deployment/frappe-web -- \
  mysql -h mariadb -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES"
```

## Estructura de archivos

```
k8s/
├── base/
│   ├── kustomization.yaml      # Kustomize config
│   ├── namespace.yaml          # Namespace kairos
│   ├── configmap.yaml          # Configuración
│   ├── secrets.yaml            # Credenciales (template)
│   ├── pvc.yaml                # Persistent volumes
│   ├── deployment-web.yaml     # Gunicorn web server
│   ├── deployment-worker.yaml  # Background workers
│   ├── deployment-scheduler.yaml # Cron scheduler
│   ├── deployment-socketio.yaml  # WebSocket server
│   ├── deployment-redis.yaml   # Redis cache & queue
│   ├── deployment-mariadb.yaml # Database
│   ├── services.yaml           # ClusterIP services
│   ├── ingress.yaml            # GKE Ingress + SSL
│   └── job-create-site.yaml    # Site creation job
├── overlays/
│   └── production/
│       └── kustomization.yaml  # Production overrides
└── README.md
```

## Producción Checklist

- [ ] Secrets configurados con valores seguros
- [ ] IP estática reservada
- [ ] Dominio DNS apuntando a IP
- [ ] SSL certificate configurado
- [ ] Filestore o RWX storage creado
- [ ] Recursos ajustados según carga
- [ ] Backup CronJob habilitado
- [ ] Monitoring configurado (Cloud Monitoring)
- [ ] Alertas configuradas
