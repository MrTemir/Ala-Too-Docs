# Деплой AlaToo-Doc на сервер

Этот гайд проводит от чистого сервера до работающего сайта на HTTPS. Каждый шаг
объясняет, что мы делаем и зачем, чтобы было понятно, а не просто скопировано.

## 0. Как устроен продакшен (общая картина)

```
 Браузер ──HTTPS──▶ Caddy :443 ──┬── /api/*, /static/*, /docs ──▶ backend (FastAPI :8000) ──▶ db (PostgreSQL)
                                 └── всё остальное ─────────────▶ frontend (Next.js :3000)
```

Всё запускается через **Docker Compose**: четыре контейнера описаны в `docker-compose.yml`.

| Контейнер | Что внутри | Зачем |
|---|---|---|
| `caddy` | веб-сервер Caddy | Единственный, кто смотрит в интернет (порты 80/443). Сам получает и продлевает HTTPS-сертификат Let's Encrypt и раскидывает запросы по путям. |
| `frontend` | Next.js в режиме `standalone` | Отдаёт страницы сайта. |
| `backend` | FastAPI + uvicorn (2 процесса) | API, генерация PDF, запросы к Groq. |
| `db` | PostgreSQL 16 | База пользователей и документов. |

**Почему Docker, а не «поставить Python и Node прямо на сервер»?**
- Окружение одинаковое у тебя и на сервере: версии Python, Node и шрифтов зашиты в образ.
- Шрифты для PDF (Liberation Serif с кириллицей и кыргызскими Ң Ө Ү) ставятся внутри образа,
  поэтому PDF выглядит одинаково везде.
- Обновление = `git pull` + одна команда, откат = вернуть прошлый коммит.

**Почему один домен для фронта и API?** Фронтенд собирается с пустым `NEXT_PUBLIC_API_URL`,
то есть делает запросы на относительные пути `/api/...` того же домена. Caddy сам отправляет их
в бэкенд. Плюсы: не нужен отдельный поддомен, нет проблем с CORS, один сертификат.

**Почему PostgreSQL, а не SQLite?** SQLite это один файл, и при двух процессах uvicorn они
мешают друг другу при записи. PostgreSQL рассчитан на одновременную работу и проще бэкапится.

**Данные, которые переживают перезапуск**, лежат в Docker volumes:
- `pgdata` — база данных;
- `pdfs` — сгенерированные PDF (`/app/static` в контейнере бэкенда);
- `caddy_data` — HTTPS-сертификаты.

Команда `docker compose down` их **не трогает**. Их удаляет только `docker compose down -v`,
никогда не запускай её на сервере без бэкапа.

---

## 1. Что нужно заранее

- Сервер с Ubuntu 22.04/24.04 или Debian 12, минимум 1 ГБ RAM (лучше 2 ГБ: сборка Next.js прожорливая).
- SSH-доступ к нему.
- Домен (необязательно). Без домена сайт будет работать по `http://IP` без HTTPS.
- Новый ключ Groq API. Старый засветился, его нужно **отозвать** в
  [console.groq.com/keys](https://console.groq.com/keys) и создать новый.

## 2. DNS: направить домен на сервер

В панели регистратора домена создай запись:

```
Тип: A    Имя: docs (или @ для корня)    Значение: <IP сервера>
```

**Зачем:** Let's Encrypt выдаёт сертификат, только если домен уже указывает на сервер. Caddy
при старте проверит это сам. Сделай этот шаг первым: DNS обновляется от минут до пары часов.
Проверить: `nslookup docs.example.kg` должен вернуть IP сервера.

## 3. Подготовить сервер (один раз)

```bash
ssh user@IP_СЕРВЕРА
sudo apt-get update && sudo apt-get install -y git
git clone <адрес репозитория> alatoo-doc   # см. шаг 4, если репозиторий приватный
cd alatoo-doc
bash scripts/server-setup.sh
exit          # перелогиниться, чтобы применилась группа docker
ssh user@IP_СЕРВЕРА
```

Что делает `scripts/server-setup.sh`:
1. Ставит `git`, `curl`, `ufw`.
2. Ставит Docker Engine и `docker compose` официальным скриптом Docker.
3. Добавляет тебя в группу `docker`, чтобы не писать `sudo` перед каждой командой.
4. Включает файрвол и открывает только 22 (SSH), 80 и 443. Всё остальное (например 5432
   PostgreSQL) снаружи недоступно. База вообще не публикует порт: к ней ходит только backend
   по внутренней сети Docker.

## 4. Доступ сервера к приватному репозиторию (deploy key)

Репозиторий приватный, и серверу нужно право его читать. Давать серверу свой личный
SSH-ключ или токен плохо: если сервер взломают, получат доступ ко всему твоему GitHub.
Правильно сделать **deploy key**: ключ, который может только читать один репозиторий.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/alatoo_deploy -N "" -C "alatoo-server"
cat ~/.ssh/alatoo_deploy.pub
```

Скопируй выведенную строку (это **публичная** часть, её показывать безопасно) и добавь в
GitHub: репозиторий → Settings → Deploy keys → Add deploy key. Галочку «Allow write access»
**не ставь**.

Скажи SSH использовать этот ключ для GitHub:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/alatoo_deploy
  IdentitiesOnly yes
EOF
git clone git@github.com:MrTemir/Ala-Too-Docs.git alatoo-doc
cd alatoo-doc
```

Приватная часть (`~/.ssh/alatoo_deploy` без `.pub`) остаётся только на сервере.

## 5. Секреты: файл `.env`

```bash
cp .env.production.example .env
nano .env
```

Заполни:

| Переменная | Как получить | Зачем |
|---|---|---|
| `DOMAIN` | твой домен, например `docs.example.kg`; пусто = работа по IP | Caddy по нему получает сертификат |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` | пароль базы |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` | подпись токенов входа. Кто знает этот ключ, может войти под любым пользователем. Без него бэкенд в продакшене специально не запустится. |
| `GROQ_API_KEY` | новый ключ с console.groq.com | генерация и перевод текста заявлений |

Потом закрой файл от чужих глаз на сервере:

```bash
chmod 600 .env
```

`.env` указан в `.gitignore` и в git не попадает. Ключи живут **только** здесь: не в коде,
не в чате, не в скриншотах.

## 6. Первый запуск

```bash
docker compose up -d --build
```

Что происходит:
1. `--build` собирает два образа: бэкенд (`Dockerfile` в корне) и фронтенд (`frontend/Dockerfile`).
   Первая сборка занимает 3–7 минут.
2. Стартует `db`. Compose ждёт, пока healthcheck `pg_isready` скажет, что база готова.
3. Стартует `backend`: сначала `python -m app.cli init-db` создаёт таблицы (если их нет), потом
   запускается uvicorn.
4. Стартуют `frontend` и `caddy`. Caddy получает сертификат (если указан `DOMAIN`).
5. `-d` значит «в фоне»: можно закрыть SSH, всё продолжит работать. `restart: unless-stopped`
   поднимет контейнеры после перезагрузки сервера.

Проверка:

```bash
docker compose ps                       # все контейнеры Up, backend и db (healthy)
curl -s http://localhost/health         # {"status":"ok"}
docker compose logs -f caddy            # видно получение сертификата; Ctrl+C для выхода
```

Открой в браузере `https://твой-домен` (или `http://IP`).

## 7. Создать пользователей

Регистрации на сайте нет, а тестовые аккаунты `123/456/789` удалены из кода ради безопасности.
Пользователей создаём командой внутри контейнера бэкенда. Пароль спрашивается интерактивно и
не остаётся в истории команд:

```bash
docker compose exec backend python -m app.cli create-user \
  --university-id 1001 --full-name "Админ Админов" --role admin

docker compose exec backend python -m app.cli create-user \
  --university-id 2001 --full-name "Асанов Үмүт" --role student \
  --faculty "Computer Science" --group "COM-22"

docker compose exec backend python -m app.cli create-user \
  --university-id 3001 --full-name "Декан Деканов" --role dean
```

Роли: `student`, `teacher`, `dean`, `admin`. Сменить пароль:
`docker compose exec backend python -m app.cli set-password --university-id 1001`.

## 8. Обновление после новых коммитов

```bash
cd ~/alatoo-doc
git pull
docker compose up -d --build
```

Compose пересоберёт только изменившиеся образы и перезапустит только их. База и PDF остаются.

Откат на прошлую версию: `git checkout <хеш-коммита>` и та же команда `up -d --build`.

## 9. Бэкап базы

```bash
docker compose exec -T db pg_dump -U alatoo alatoo | gzip > backup-$(date +%F).sql.gz
```

Восстановление (перезапишет данные, сначала убедись, что это нужно):

```bash
gunzip -c backup-2026-11-13.sql.gz | docker compose exec -T db psql -U alatoo alatoo
```

## 10. Полезные команды и типичные проблемы

```bash
docker compose logs -f backend     # логи бэкенда (ошибки Groq, PDF)
docker compose restart backend     # перезапуск после правки .env
docker compose exec db psql -U alatoo alatoo   # консоль базы
```

| Симптом | Причина и решение |
|---|---|
| Caddy пишет про ошибку ACME/сертификата | Домен ещё не указывает на сервер или закрыт порт 80. Проверь `nslookup` и `sudo ufw status`. |
| «GROQ_API_KEY is not set» при генерации | Ключ не заполнен в `.env`. Заполни и `docker compose up -d backend`. |
| backend сразу падает с `JWT_SECRET_KEY must be set` | Не заполнен `JWT_SECRET_KEY` в `.env`. |
| Сборка фронтенда падает с `Killed` | Мало памяти. Добавь swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`. |
| Порт 80/443 занят | На сервере уже есть nginx/apache. Не удаляй его без проверки: возможно, на нём другие сайты. Тогда Caddy убирают, а в существующий nginx добавляют проксирование на контейнеры. |
