# Kairos - Modelo de Datos

## Resumen

Kairos es una plataforma de comunicación entre colegios y padres construida sobre Frappe Framework v15.

| Tipo | Cantidad |
|------|----------|
| DocTypes Custom Kairos | 25 |
| DocTypes Frappe Core utilizados | 5 |
| **Total** | **30** |

---

## Leyenda

- 🔵 **Frappe Core**: DocTypes nativos de Frappe Framework
- 🟢 **Kairos Custom**: DocTypes desarrollados para Kairos

---

## 1. Entidades Base

### 🟢 Institution
**Tabla:** `tabInstitution`
**Propósito:** Representa la institución educativa principal (colegio, escuela). Es la entidad raíz del sistema multi-tenant.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `INST-.#####` |
| institution_name | Data | Nombre completo de la institución |
| short_name | Data | Nombre corto/siglas |
| legal_name | Data | Razón social |
| tax_id | Data | CUIT/RUT |
| institution_type | Select | Public/Private/Charter |
| is_active | Check | Estado activo |
| logo | Attach Image | Logo institucional |
| website | Data | URL del sitio web |
| email | Data | Email institucional |
| phone | Data | Teléfono principal |
| address | Small Text | Dirección |
| city | Data | Ciudad |
| state | Data | Provincia/Estado |
| country | Data | País (default: Argentina) |
| postal_code | Data | Código postal |
| founded_date | Date | Fecha de fundación |

---

### 🟢 Campus
**Tabla:** `tabCampus`
**Propósito:** Representa una sede física de la institución. Una institución puede tener múltiples campus.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `CAMP-.#####` |
| campus_name | Data | Nombre del campus |
| campus_code | Data | Código único |
| institution | Link → Institution | Institución padre |
| is_active | Check | Estado activo |
| address | Small Text | Dirección |
| city | Data | Ciudad |
| country | Data | País |
| latitude | Float | Coordenada latitud |
| longitude | Float | Coordenada longitud |
| timezone | Data | Zona horaria |
| academic_levels | Select | Niveles que ofrece |
| max_capacity | Int | Capacidad máxima |

---

### 🟢 Grade
**Tabla:** `tabGrade`
**Propósito:** Representa un grado o año escolar (ej: 1° Grado, 2° Año).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `GRD-.#####` |
| grade_name | Data | Nombre del grado |
| grade_code | Data | Código único |
| campus | Link → Campus | Campus al que pertenece |
| grade_order | Int | Orden para listados |
| is_active | Check | Estado activo |
| academic_level | Select | Nivel académico |
| description | Small Text | Descripción |

---

### 🟢 Section
**Tabla:** `tabSection`
**Propósito:** Representa una división/sección dentro de un grado (ej: 1°A, 1°B).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `SEC-.#####` |
| section_name | Data | Nombre (ej: "División A") |
| section_code | Data | Código (ej: "A") |
| grade | Link → Grade | Grado padre |
| academic_year | Link → Academic Year | Año académico |
| homeroom_teacher | Link → User | Tutor/Maestro |
| student_group | Link → Student Group | Grupo de estudiantes |
| max_students | Int | Capacidad máxima |
| is_active | Check | Estado activo |

---

## 2. Personas

### 🟢 Student
**Tabla:** `tabStudent`
**Propósito:** Representa a un alumno inscrito en la institución.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `STU-.YYYY.-.#####` |
| first_name | Data | Nombre |
| middle_name | Data | Segundo nombre |
| last_name | Data | Apellido |
| full_name | Data | Nombre completo (calculado) |
| date_of_birth | Date | Fecha de nacimiento |
| gender | Select | Male/Female/Other |
| blood_group | Select | Grupo sanguíneo |
| student_email | Data | Email del alumno |
| student_mobile | Data | Teléfono del alumno |
| nationality | Data | Nacionalidad |
| address | Small Text | Dirección |
| photo | Attach Image | Foto |
| enrollment_date | Date | Fecha de inscripción |
| status | Select | Active/Inactive/Graduated/Transferred |
| institution | Link → Institution | Institución |
| campus | Link → Campus | Campus actual |
| current_grade | Link → Grade | Grado actual |
| current_section | Link → Section | Sección actual |
| emergency_contact_name | Data | Contacto de emergencia |
| emergency_contact_phone | Data | Teléfono emergencia |
| emergency_contact_relation | Data | Relación |
| allergies | Small Text | Alergias |
| medical_conditions | Small Text | Condiciones médicas |
| special_needs | Small Text | Necesidades especiales |

---

### 🟢 Guardian
**Tabla:** `tabGuardian`
**Propósito:** Representa a un padre, madre o tutor de estudiantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `GRD-.#####` |
| first_name | Data | Nombre |
| middle_name | Data | Segundo nombre |
| last_name | Data | Apellido |
| full_name | Data | Nombre completo (calculado) |
| relation | Select | Father/Mother/Guardian/Grandparent/Other |
| gender | Select | Male/Female/Other |
| date_of_birth | Date | Fecha de nacimiento |
| email | Data | Email (requerido) |
| mobile | Data | Teléfono móvil (requerido) |
| alternate_phone | Data | Teléfono alternativo |
| work_phone | Data | Teléfono trabajo |
| address | Small Text | Dirección |
| city | Data | Ciudad |
| state | Data | Provincia |
| country | Data | País |
| postal_code | Data | Código postal |
| occupation | Data | Ocupación |
| company | Data | Empresa |
| photo | Attach Image | Foto |
| is_primary_contact | Check | Es contacto principal |
| can_pickup | Check | Autorizado a retirar |
| user | Link → User | Usuario del sistema |
| notes | Small Text | Notas |

---

### 🟢 Student Guardian
**Tabla:** `tabStudent Guardian`
**Propósito:** Tabla de relación muchos-a-muchos entre Student y Guardian. Un estudiante puede tener múltiples tutores y viceversa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | format | `{student}-{guardian}` |
| student | Link → Student | Estudiante |
| student_name | Data | Nombre (fetch) |
| guardian | Link → Guardian | Tutor |
| guardian_name | Data | Nombre (fetch) |
| relation | Select | Relación específica |
| is_primary | Check | Es tutor principal del estudiante |
| can_receive_communications | Check | Recibe comunicados |
| can_pickup | Check | Autorizado a retirar |
| notes | Small Text | Notas |

---

## 3. Asignaciones

### 🟢 Student Campus Assignment
**Tabla:** `tabStudent Campus Assignment`
**Propósito:** Registra la inscripción de un estudiante en un campus para un año académico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `SCA-.#####` |
| student | Link → Student | Estudiante |
| campus | Link → Campus | Campus |
| grade | Link → Grade | Grado |
| section | Link → Section | Sección |
| academic_year | Link → Academic Year | Año académico |
| enrollment_date | Date | Fecha de inscripción |
| status | Select | Active/Inactive/Transferred |

---

### 🟢 Staff Campus Assignment
**Tabla:** `tabStaff Campus Assignment`
**Propósito:** Asigna personal (docentes, administrativos) a un campus.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `STCA-.#####` |
| staff | Link → User | Personal |
| campus | Link → Campus | Campus |
| role_at_campus | Select | Director/Coordinator/Teacher/Admin/Support |
| start_date | Date | Fecha inicio |
| end_date | Date | Fecha fin |
| is_active | Check | Estado activo |

---

### 🟢 Staff Section Assignment
**Tabla:** `tabStaff Section Assignment`
**Propósito:** Asigna docentes a secciones específicas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `SSA-.#####` |
| staff | Link → User | Docente |
| section | Link → Section | Sección |
| role | Select | Homeroom/Subject/Assistant |
| subject | Data | Materia (si aplica) |
| academic_year | Link → Academic Year | Año académico |
| is_active | Check | Estado activo |

---

## 4. Mensajería

### 🟢 Message
**Tabla:** `tabMessage`
**Propósito:** Comunicado principal enviado desde la institución a los padres/tutores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `MSG-.YYYY.-.#####` |
| subject | Data | Asunto |
| content | Text Editor | Contenido HTML |
| category | Link → Message Category | Categoría |
| priority | Select | Urgent/High/Normal |
| scope_type | Select | Institution/Campus/Grade/Section/Group/Individual |
| institution | Link → Institution | Institución destino |
| campus | Link → Campus | Campus destino |
| grade | Link → Grade | Grado destino |
| section | Link → Section | Sección destino |
| sender | Link → User | Remitente |
| status | Select | Draft/Scheduled/Sent/Cancelled |
| scheduled_datetime | Datetime | Fecha programada |
| sent_datetime | Datetime | Fecha de envío |
| send_email | Check | Enviar por email |
| send_sms | Check | Enviar por SMS |
| send_push | Check | Enviar push notification |
| requires_acknowledgment | Check | Requiere confirmación |
| total_recipients | Int | Total destinatarios |
| delivered_count | Int | Entregados |
| read_count | Int | Leídos |
| acknowledged_count | Int | Confirmados |

---

### 🟢 Message Recipient
**Tabla:** `tabMessage Recipient`
**Propósito:** Registro de entrega individual de un mensaje a cada destinatario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `MRCP-.#####` |
| message | Link → Message | Mensaje padre |
| guardian | Link → Guardian | Destinatario |
| student | Link → Student | Estudiante relacionado |
| email_status | Select | Pending/Sent/Delivered/Failed/Bounced |
| email_sent_at | Datetime | Fecha envío email |
| sms_status | Select | Pending/Sent/Delivered/Failed |
| sms_sent_at | Datetime | Fecha envío SMS |
| push_status | Select | Pending/Sent/Delivered/Failed |
| push_sent_at | Datetime | Fecha envío push |
| read_at | Datetime | Fecha de lectura |
| acknowledged_at | Datetime | Fecha de confirmación |

---

### 🟢 Message Reply
**Tabla:** `tabMessage Reply`
**Propósito:** Respuestas de los tutores a mensajes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `MRPL-.#####` |
| message | Link → Message | Mensaje original |
| guardian | Link → Guardian | Autor respuesta |
| content | Text Editor | Contenido |
| replied_at | Datetime | Fecha respuesta |

---

### 🟢 Message Template
**Tabla:** `tabMessage Template`
**Propósito:** Plantillas predefinidas para mensajes frecuentes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | field | `template_name` |
| template_name | Data | Nombre de plantilla |
| subject | Data | Asunto predefinido |
| content | Text Editor | Contenido con variables |
| category | Link → Message Category | Categoría |
| is_active | Check | Estado activo |

---

### 🟢 Message Category
**Tabla:** `tabMessage Category`
**Propósito:** Categorías para clasificar mensajes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | field | `category_name` |
| category_name | Data | Nombre |
| color | Select | Color para UI |
| icon | Data | Ícono |
| is_active | Check | Estado activo |

---

### 🟢 Message Attachment
**Tabla:** `tabMessage Attachment`
**Propósito:** Archivos adjuntos a mensajes (Child Table).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| istable | 1 | Es tabla hija |
| file | Attach | Archivo |
| file_name | Data | Nombre archivo |
| file_size | Int | Tamaño en bytes |

---

## 5. Noticias

### 🟢 News
**Tabla:** `tabNews`
**Propósito:** Artículos de noticias y anuncios para la comunidad escolar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `NEWS-.YYYY.-.#####` |
| title | Data | Título |
| slug | Data | URL amigable |
| summary | Small Text | Resumen |
| content | Text Editor | Contenido completo |
| featured_image | Attach Image | Imagen principal |
| category | Link → News Category | Categoría |
| author | Link → User | Autor |
| scope_type | Select | Institution/Campus/Grade/Section |
| institution | Link → Institution | Alcance institución |
| campus | Link → Campus | Alcance campus |
| status | Select | Draft/Published/Archived |
| publish_date | Datetime | Fecha publicación |
| is_featured | Check | Es destacada |
| is_pinned | Check | Está fijada |
| allow_comments | Check | Permite comentarios |
| views_count | Int | Cantidad de vistas |
| meta_title | Data | SEO título |
| meta_description | Small Text | SEO descripción |

---

### 🟢 News Category
**Tabla:** `tabNews Category`
**Propósito:** Categorías para clasificar noticias.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | field | `category_name` |
| category_name | Data | Nombre |
| color | Data | Color |
| is_active | Check | Estado activo |

---

### 🟢 News Comment
**Tabla:** `tabNews Comment`
**Propósito:** Comentarios en noticias.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `NCMT-.#####` |
| news | Link → News | Noticia |
| author | Link → User | Autor |
| content | Text Editor | Contenido |
| parent_comment | Link → News Comment | Comentario padre (threading) |
| status | Select | Pending/Approved/Rejected |
| published_at | Datetime | Fecha publicación |

---

## 6. Eventos

### 🟢 School Event
**Tabla:** `tabSchool Event`
**Propósito:** Eventos escolares con RSVP y recordatorios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `SEVT-.YYYY.-.#####` |
| event_name | Data | Nombre del evento |
| slug | Data | URL amigable |
| summary | Small Text | Resumen |
| description | Text Editor | Descripción completa |
| featured_image | Attach Image | Imagen |
| start_datetime | Datetime | Inicio |
| end_datetime | Datetime | Fin |
| all_day | Check | Todo el día |
| timezone | Data | Zona horaria |
| location_type | Select | In-Person/Virtual/Hybrid |
| venue_name | Data | Lugar |
| venue_address | Small Text | Dirección |
| room | Data | Sala/Aula |
| latitude | Float | Latitud |
| longitude | Float | Longitud |
| virtual_link | Data | Link reunión virtual |
| virtual_password | Data | Contraseña |
| scope_type | Select | Institution/Campus/Grade/Section |
| institution | Link → Institution | Alcance |
| campus | Link → Campus | Alcance |
| grade | Link → Grade | Alcance |
| section | Link → Section | Alcance |
| organizer | Link → User | Organizador |
| category | Link → Event Category | Categoría |
| status | Select | Draft/Published/Cancelled/Completed |
| publish_date | Datetime | Fecha publicación |
| is_featured | Check | Es destacado |
| rsvp_enabled | Check | RSVP habilitado |
| rsvp_deadline | Datetime | Fecha límite RSVP |
| max_attendees | Int | Capacidad máxima |
| waitlist_enabled | Check | Lista de espera |
| rsvp_options | Select | Yes-No / Yes-No-Maybe |
| guests_allowed | Check | Permite invitados |
| max_guests_per_rsvp | Int | Máx invitados por RSVP |
| send_reminder | Check | Enviar recordatorio |
| reminder_days_before | Int | Días antes |
| views_count | Int | Vistas |
| rsvp_yes_count | Int | Confirmados |
| rsvp_no_count | Int | No asisten |
| rsvp_maybe_count | Int | Tal vez |

---

### 🟢 Event Category
**Tabla:** `tabEvent Category`
**Propósito:** Categorías de eventos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | field | `category_name` |
| category_name | Data | Nombre |
| color | Data | Color |
| icon | Data | Ícono |
| is_active | Check | Estado activo |

---

### 🟢 Event RSVP
**Tabla:** `tabEvent RSVP`
**Propósito:** Respuestas RSVP a eventos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `RSVP-.#####` |
| event | Link → School Event | Evento |
| guardian | Link → Guardian | Respondiente |
| student | Link → Student | Estudiante relacionado |
| response | Select | Yes/No/Maybe |
| guests_count | Int | Cantidad de invitados |
| guest_names | Small Text | Nombres invitados |
| responded_at | Datetime | Fecha respuesta |
| is_waitlisted | Check | En lista de espera |
| check_in_time | Datetime | Hora de ingreso |
| notes | Small Text | Notas |

---

### 🟢 Event Reminder
**Tabla:** `tabEvent Reminder`
**Propósito:** Recordatorios programados para eventos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| naming_series | Select | `EREM-.#####` |
| event | Link → School Event | Evento |
| reminder_datetime | Datetime | Fecha/hora del recordatorio |
| reminder_type | Select | Email/SMS/Push/All |
| status | Select | Pending/Sent/Failed |
| sent_at | Datetime | Fecha de envío |

---

### 🟢 Event Attachment
**Tabla:** `tabEvent Attachment`
**Propósito:** Archivos adjuntos a eventos (Child Table).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| istable | 1 | Es tabla hija |
| file | Attach | Archivo |
| file_name | Data | Nombre |
| description | Data | Descripción |

---

## 7. Preferencias

### 🟢 Guardian Communication Preferences
**Tabla:** `tabGuardian Communication Preferences`
**Propósito:** Preferencias de comunicación de cada tutor.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| autoname | field | `guardian` |
| guardian | Link → Guardian | Tutor |
| preferred_language | Select | es/en/pt |
| email_enabled | Check | Recibir emails |
| sms_enabled | Check | Recibir SMS |
| push_enabled | Check | Recibir push |
| email_verified | Check | Email verificado |
| phone_verified | Check | Teléfono verificado |
| quiet_hours_enabled | Check | Horas de silencio |
| quiet_hours_start | Time | Inicio silencio |
| quiet_hours_end | Time | Fin silencio |
| digest_frequency | Select | Immediate/Daily/Weekly |
| categories_subscribed | Small Text | Categorías suscritas |

---

## 8. DocTypes Frappe Core Utilizados

### 🔵 User
**Tabla:** `tabUser`
**Propósito:** Usuarios del sistema (docentes, administrativos, padres con acceso).

Campos principales utilizados:
- `email`: Email único
- `full_name`: Nombre completo
- `enabled`: Estado activo
- `roles`: Roles asignados

---

### 🔵 Role
**Tabla:** `tabRole`
**Propósito:** Roles de permisos.

Roles personalizados Kairos:
- `School Admin`: Administrador escolar
- `Teacher`: Docente
- `Parent`: Padre/Tutor
- `Student`: Estudiante (si tiene acceso)

---

### 🔵 File
**Tabla:** `tabFile`
**Propósito:** Almacenamiento de archivos adjuntos.

---

### 🔵 Communication
**Tabla:** `tabCommunication`
**Propósito:** Registro de comunicaciones (emails enviados, etc).

---

### 🔵 Notification Log
**Tabla:** `tabNotification Log`
**Propósito:** Log de notificaciones enviadas.

---

## Diagrama de Relaciones

```
                    ┌─────────────┐
                    │ Institution │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌─────────┐
         │ Campus │   │  News  │   │ Message │
         └───┬────┘   └────────┘   └─────────┘
             │
      ┌──────┼──────┐
      │      │      │
      ▼      ▼      ▼
  ┌───────┐ ┌─────┐ ┌──────────────┐
  │ Grade │ │Staff│ │ School Event │
  └───┬───┘ └─────┘ └──────────────┘
      │
      ▼
  ┌─────────┐
  │ Section │
  └────┬────┘
       │
       ▼
  ┌─────────┐     ┌──────────────────┐     ┌──────────┐
  │ Student │◄────│ Student Guardian │────►│ Guardian │
  └─────────┘     └──────────────────┘     └──────────┘
```

---

## Estadísticas de Test Data

| DocType | Registros |
|---------|-----------|
| Institution | 4 |
| Campus | 5 |
| Grade | 9 |
| Section | 18 |
| Student | 15 |
| Guardian | 10 |
| Student Guardian | 20 |
| Message Category | 6 |
| News Category | 6 |
| Event Category | 6 |
| Message Template | 4 |
| Message | 7 |
| News | 6 |
| School Event | 11 |

---

## Notas Técnicas

1. **Naming Series**: Todos los DocTypes principales usan `naming_series` para IDs legibles
2. **Soft Delete**: Frappe usa `docstatus` para control de estados
3. **Audit Trail**: `track_changes: 1` habilitado para historial
4. **Permisos**: Configurados por Role en cada DocType
5. **Scope Pattern**: Messages, News y Events usan scope jerárquico (Institution → Campus → Grade → Section)

---

*Documento generado automáticamente - Kairos v1.0*
