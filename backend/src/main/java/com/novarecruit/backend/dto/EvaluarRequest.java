package com.novarecruit.backend.dto;

import java.util.List;

public record EvaluarRequest(
        List<RespuestaEvaluacionRequest> respuestas
) {
}