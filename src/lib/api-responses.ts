import { NextResponse } from "next/server";

/*
 * Ответы об отказе в доступе — одни на все маршруты.
 *
 * Раньше 401 набирался вручную в трёх десятках обработчиков, и текст в них
 * разошёлся: часть отвечала «Необходима авторизация», часть — «Unauthorized».
 * Клиент показывает это поле как есть, так что один и тот же отказ звучал
 * по-разному в зависимости от того, какую кнопку нажали.
 */

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
}

export function forbiddenResponse(message = "Недостаточно прав") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Отказ из `requireAdmin`: код ответа едет вместе с ошибкой, а не угадывается по тексту. */
export class ApiAccessError extends Error {
  constructor(
    readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "ApiAccessError";
  }
}

export function accessErrorResponse(err: unknown) {
  if (err instanceof ApiAccessError) {
    return err.status === 401 ? unauthorizedResponse() : forbiddenResponse(err.message);
  }
  return forbiddenResponse();
}
