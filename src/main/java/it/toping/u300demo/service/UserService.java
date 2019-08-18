package it.toping.u300demo.service;

import it.toping.u300demo.domain.Manager;
import it.toping.u300demo.domain.User;
import it.toping.u300demo.repository.ManagerRepository;
import it.toping.u300demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UserService implements CommandLineRunner {

    private final UserRepository users;
    private final ManagerRepository managers;

    @Autowired
    public UserService(UserRepository userRepository, ManagerRepository managerRepository) {
        this.users = userRepository;
        this.managers = managerRepository;
    }

    @Override
    public void run(String... strings) throws Exception {
        //this.repository.save(new User("신수웅", "사고뭉치", "010-5588-3944"));
        Manager greg = this.managers.save(new Manager("greg", "turnquist",
                new String[]{"ROLE_MANAGER"}));
        Manager oliver = this.managers.save(new Manager("oliver", "gierke",
                new String[]{"ROLE_MANAGER"}));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("greg", "doesn't matter",
                        AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

        this.users.save(new User("Frodo", "Baggins", "ring bearer", greg));
        this.users.save(new User("Bilbo", "Baggins", "burglar", greg));
        this.users.save(new User("Gandalf", "the Grey", "wizard", greg));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("oliver", "doesn't matter",
                        AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

        this.users.save(new User("Samwise", "Gamgee", "gardener", oliver));
        this.users.save(new User("Merry", "Brandybuck", "pony rider", oliver));
        this.users.save(new User("Peregrin", "Took", "pipe smoker", oliver));

        SecurityContextHolder.clearContext();
    }
}
