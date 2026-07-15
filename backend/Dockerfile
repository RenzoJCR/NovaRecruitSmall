# =====================================================
# ETAPA 1: Compilación del backend con Maven y Java 21
# =====================================================
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copiamos primero el pom para aprovechar la caché
COPY pom.xml .

RUN mvn -B dependency:go-offline

# Copiamos el código fuente
COPY src ./src

# Generamos el archivo JAR sin ejecutar pruebas
RUN mvn -B clean package -DskipTests


# =====================================================
# ETAPA 2: Ejecución del backend
# =====================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copiamos únicamente el JAR generado
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]