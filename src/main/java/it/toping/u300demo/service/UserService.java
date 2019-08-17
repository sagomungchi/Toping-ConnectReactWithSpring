package it.toping.u300demo.service;

import it.toping.u300demo.domain.User;
import it.toping.u300demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UserService implements CommandLineRunner {

    private final UserRepository repository;

    @Autowired
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... strings) throws Exception {
        this.repository.save(new User("신수웅", "사고뭉치", "010-5588-3944"));
    }
}
