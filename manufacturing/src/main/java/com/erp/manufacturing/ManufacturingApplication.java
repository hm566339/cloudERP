package com.erp.manufacturing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@org.springframework.context.annotation.EnableAspectJAutoProxy
@org.springframework.scheduling.annotation.EnableScheduling
public class ManufacturingApplication {

	public static void main(String[] args) {
		SpringApplication.run(ManufacturingApplication.class, args);
	}

}
