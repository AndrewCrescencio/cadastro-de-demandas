/**
 * Content Security Policy (CSP) middleware.
 *
 * Camada adicional de defesa contra XSS: instrui o navegador a não executar
 * scripts inline, bloquear eval() e permitir apenas recursos da mesma origem.
 *
 * Política:
 * - default-src 'self': apenas recursos da mesma origem
 * - script-src 'self': scripts apenas da mesma origem (bloqueia inline scripts)
 * - style-src 'self': apenas CSS da mesma origem
 * - img-src 'self' data: imagens da mesma origem e data URIs
 * - connect-src 'self': chamadas de API apenas para mesma origem
 * - object-src 'none': bloqueia plugins (object, embed, applet)
 * - base-uri 'self': restringe <base>
 * - form-action 'self': restringe envio de formulários
 * - frame-ancestors 'none': impede clickjacking via iframe
 *
 * Referências para build:
 * - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 */

import { defineEventHandler, appendResponseHeader } from 'h3'

const CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self'; " +
  "img-src 'self' data:; " +
  "connect-src 'self'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-ancestors 'none';"

export default defineEventHandler((event) => {
  appendResponseHeader(event, 'Content-Security-Policy', CSP)
})
