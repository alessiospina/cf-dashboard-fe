# Test Components per Componenti Geografici

Questa cartella contiene componenti di test e debug per i componenti geografici.

## File Inclusi

- `GeoTestComponent.vue` - Test base per province e comuni autocomplete
- `DebugGeoComponent.vue` - Debug avanzato con test API e logging

## Come Usare

Aggiungi temporaneamente queste rotte al router per testare:

```javascript
{
  path: '/test-geo',
  name: 'TestGeo',
  component: () => import('@/components/geo/tests/GeoTestComponent.vue'),
},
{
  path: '/debug-geo', 
  name: 'DebugGeo',
  component: () => import('@/components/geo/tests/DebugGeoComponent.vue'),
}
```

## Risoluzione Problemi

Se i dropdown non si aprono:
1. Controlla che le API geografiche rispondano
2. Verifica che useGeo() sia inizializzato
3. Controlla z-index e CSS conflicts nelle modali
4. Verifica che non ci siano errori Teleport (usare posizionamento relativo)
