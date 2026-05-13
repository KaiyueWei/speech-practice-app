package com.kaiyuewei;

import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.CustomerRepository;
import com.kaiyuewei.customer.Gender;
import com.github.javafaker.Faker;
import com.github.javafaker.Name;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Random;

@SpringBootApplication
public class Main {

    private static final Logger log = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

    @Bean
    @Profile("dev")
    CommandLineRunner runner(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        return args -> createRandomCustomer(customerRepository, passwordEncoder);
    }

    private static void createRandomCustomer(CustomerRepository customerRepository,
                                             PasswordEncoder passwordEncoder) {
        Faker faker = new Faker();
        Random random = new Random();
        Name name = faker.name();
        String firstName = name.firstName();
        String lastName = name.lastName();
        int age = random.nextInt(16, 99);
        Gender gender = age % 2 == 0 ? Gender.MALE : Gender.FEMALE;
        String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@kaiyuewei.com";
        Customer customer = new Customer(
                firstName + " " + lastName,
                email,
                passwordEncoder.encode("password"),
                age,
                gender);
        customerRepository.save(customer);
        log.info("seed_customer email={}", email);
    }

}