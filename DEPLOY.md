# Deploy — cf-dashboard-fe

## Prerequisiti

- Docker Desktop installato e avviato
- Registry privato `cf-registry` in esecuzione sulla porta 6000
- Secret GitHub configurati nel repo (vedi sezione Secret)

---

## Secret GitHub richiesti

Configurali in **Settings → Secrets and variables → Actions**:

| Secret | Descrizione |
|---|---|
| `REGISTRY_HOST` | Indirizzo e porta del registry privato |
| `REGISTRY_USER` | Username del registry |
| `REGISTRY_PASSWORD` | Password del registry |
| `VITE_API_PROTOCOL` | Protocollo del backend (`http` o `https`) |
| `VITE_API_HOST` | Host del backend |
| `VITE_API_PORT` | Porta del backend |

---

## Rilascio (dal PC di sviluppo)

Per triggerare una nuova build su GitHub Actions, crea un tag e pushalo:

```bash
git tag v1.x.x
git push origin main v1.x.x
```

> ⚠️ Le variabili `VITE_API_*` vengono baked nell'immagine durante la build.
> Se cambia l'indirizzo del backend, aggiorna i secret e fai un nuovo rilascio.

---

## Deploy sul server (via SSH)

Connettiti al server:

```bash
ssh cfuser@centro.w3ddns.it
```

### Prima installazione

```powershell
$env:DOCKER_CONFIG = "C:\docker-cfg"
docker pull localhost:6000/cf-dashboard-fe:latest

docker run -d `
  --name cf-dashboard-fe `
  --restart always `
  -p 0.0.0.0:8080:8080 `
  localhost:6000/cf-dashboard-fe:latest
```

### Aggiornamento a nuova versione

```powershell
$env:DOCKER_CONFIG = "C:\docker-cfg"
docker pull localhost:6000/cf-dashboard-fe:latest
docker stop cf-dashboard-fe
docker rm cf-dashboard-fe

docker run -d `
  --name cf-dashboard-fe `
  --restart always `
  -p 0.0.0.0:8080:8080 `
  localhost:6000/cf-dashboard-fe:latest
```

---

## Comandi utili

```powershell
# Verifica che il container sia in esecuzione
docker ps | findstr cf-dashboard-fe

# Visualizza i log in tempo reale
docker logs -f cf-dashboard-fe

# Riavvia il container
docker restart cf-dashboard-fe
```

---

## Porte

| Servizio | Porta |
|---|---|
| Frontend | 8080 |
