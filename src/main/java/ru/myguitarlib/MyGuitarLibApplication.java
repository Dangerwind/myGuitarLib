package ru.myguitarlib;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import ru.myguitarlib.config.SecurityProperties;

@SpringBootApplication
//@EnableConfigurationProperties(SecurityProperties.class)
public class MyGuitarLibApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyGuitarLibApplication.class, args);
	}

}
