#!/bin/bash
set -xeuo pipefail

display_help() {
  echo "Usage: $0 {shell|security|frontend|backend|backend-license|frontend-license|e2e}" >&2
  echo
  echo "   shell              run shell check for the whole project"
  echo "   security           run security check for the whole project"
  echo "   frontend           run check for the frontend"
  echo "   px                 run css px check for the frontend"
  echo "   backend            run check for the backend"
  echo "   backend-license    check license for the backend"
  echo "   frontend-license   check license for the frontend"
  echo "   e2e                run e2e for the frontend"
  echo
  exit 1
}

check_shell() {
  docker run --rm -v "$PWD:/mnt" koalaman/shellcheck:stable ./ops/*.sh
}

security_check() {
  docker run --rm -it \
    -v "$PWD:/pwd" \
    trufflesecurity/trufflehog:latest \
    git file:///pwd --since-commit HEAD \
    --fail

  docker run --rm -it \
    -v "${PWD}:/path" \
    ghcr.io/gitleaks/gitleaks:latest \
    detect \
    --source="/path" \
    -v --redact
}

backend_license_check() {
  cd backend
  ./gradlew clean checkLicense
}

frontend_license_check() {
  cd frontend
  npm install
  npm run license-compliance
}

backend_check() {
  cd backend
  ./gradlew clean check
  bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r ./build/reports/jacoco/test/jacocoTestReport.xml
  ./gradlew clean build -x test
}

frontend_check(){
  cd frontend
  pnpm dlx audit-ci@^6 --config ./audit-ci.jsonc
  pnpm install --no-frozen-lockfile
  pnpm lint
  pnpm coverage
  bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r ./coverage/clover.xml
  pnpm build
}

px_check() {
  cd frontend
  local result=''
  result="$(grep -rin --exclude='*.svg' --exclude='*.png' --exclude='*.yaml' --exclude-dir='node_modules' '[0-9]\+px' ./)"
  if [ -n "$result" ]; then
    echo "Error: Found files with [0-9]+px pattern:"
    echo "$result"
    exit 1
  else
    echo "No matching files found."
  fi
}

e2e_check(){
  cd frontend
  pnpm install --no-frozen-lockfile
  pnpm run e2e
}

if [[ "$#" -le 0 ]]; then
  display_help
fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -h|--help) display_help ;;
    shell) check_shell ;;
    security) security_check ;;
    frontend) frontend_check ;;
    px) px_check ;;
    backend) backend_check ;;
    e2e) e2e_check ;;
    "backend-license") backend_license_check ;;
    "frontend-license") frontend_license_check ;;
    *) echo "Unknown parameter passed: $1" ;;
  esac
  shift
done
