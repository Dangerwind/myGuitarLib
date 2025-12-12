plugins {
	java
	application
	id("org.springframework.boot") version "3.5.7"
	id("io.spring.dependency-management") version "1.1.6"
	id("io.freefair.lombok") version "8.6"
}

group = "ru.myguitarlib"
version = "0.0.1-SNAPSHOT"
description = "Personal song lyrics and chords library for guitar practice"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("com.h2database:h2")

	// Inertia4J Spring adapter (1.0.4)
	// implementation("io.github.inertia4j:inertia4j-spring:1.0.4")

	//JsonNullableModule для сериализации JSON
	implementation("org.openapitools:jackson-databind-nullable:0.2.6")

	// чтобы мапить модели в dto
	implementation("org.mapstruct:mapstruct:1.6.3")
	annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
	implementation("org.springframework.boot:spring-boot-starter-validation")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

application {
	mainClass.set("ru.myguitarlib.MyGuitarLibApplication")
}