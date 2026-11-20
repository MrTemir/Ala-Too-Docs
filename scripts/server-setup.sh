#!/usr/bin/env bash
# Первичная настройка чистого сервера Ubuntu/Debian под AlaToo-Doc.
# Запускать один раз от пользователя с sudo:  bash scripts/server-setup.sh
set -euo pipefail

echo "==> 1/4 Обновляем список пакетов и ставим git, curl, ufw"
sudo apt-get update
sudo apt-get install -y git curl ca-certificates ufw

echo "==> 2/4 Ставим Docker Engine и плагин docker compose (официальный скрипт Docker)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
else
  echo "    Docker уже установлен: $(docker --version)"
fi

echo "==> 3/4 Разрешаем текущему пользователю запускать docker без sudo"
sudo usermod -aG docker "$USER"

echo "==> 4/4 Файрвол: открываем только SSH (22), HTTP (80) и HTTPS (443)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw --force enable
sudo ufw status

echo
echo "Готово. Выйдите из SSH и зайдите снова, чтобы группа docker применилась."
