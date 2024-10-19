import 'reflect-metadata';

import { IAIService } from '@domain/interfaces/AI.service.interface';
import { inject, injectable } from 'inversify';
import {
  IHTTPService,
  SymbolHTTPService,
} from '@domain/interfaces/HTTP.service.interface';

@injectable()
export class AIService implements IAIService {
  constructor(@inject(SymbolHTTPService) private _http: IHTTPService) {}
}

// Órdenes para el cálculo de colocación de cajas
// Definir las restricciones y áreas:

// Proporciona un JSON que contenga:
// constraints: Detalles sobre unidades, si son apilables, altura máxima de apilamiento, etc.
// areas: Listado de áreas con detalles como ID, dimensiones (ancho, alto, profundidad) y punto de inicio (x, y, z).
// boxes: Listado de cajas con ID, dimensiones (ancho, alto, profundidad) y peso.
// Indicar un start_point:

// Especifica si deseas cambiar el start_point de un área particular. Por ejemplo, "Cambia el start_point de STAGE1 a (1, 0, 1)".
// Instrucciones sobre el formato de salida:

// Indica que deseas el resultado en formato JSON.
// Especifica que necesitas el orden de colocación de las cajas y sus posiciones en coordenadas XYZ.
// Menciona que las cajas que no quepan en un área deben ser procesadas en las áreas subsiguientes.
// Pide que se incluyan rotaciones necesarias usando el enum proporcionado.
// Ejemplo de solicitud:

// "Calcula el orden de colocación de cajas para las áreas y restricciones dadas, usando un start_point de (1, 0, 1) para STAGE1".
