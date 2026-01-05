# Kairos Desk

## Qué es

Admin UI para colegios. Construido con Next.js sobre Frappe Framework.

**NO confundir con** la App para Padres (`frontend/`) que es React Native.

## Para quién es

- Directivos de colegios
- Administrativos
- Docentes

## Stack

- Next.js 16
- Frappe React SDK
- TanStack Query + Table
- Tailwind CSS
- Radix UI

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
```

## Estructura

```
kairos-app/
├── src/
│   ├── pages/           # Páginas admin
│   ├── components/      # UI components
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilidades
├── public/
└── package.json
```

## Conexión con Frappe

Este frontend se conecta al Frappe backend del mismo tenant. La URL se configura en las variables de entorno.

```typescript
// Usa frappe-react-sdk para conectar
import { FrappeProvider } from 'frappe-react-sdk';
```

## Customizaciones por Colegio

Los colegios pueden hacer customizaciones en Frappe (Custom Fields, Property Setters) que este frontend respeta. Los releases de Kairos no rompen estas customizaciones.
