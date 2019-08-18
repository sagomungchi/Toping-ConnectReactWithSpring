package it.toping.u300demo.service;

import it.toping.u300demo.domain.Manager;
import it.toping.u300demo.repository.ManagerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class UserRoleDetailService implements UserDetailsService {

    private final ManagerRepository repository;

    @Autowired
    public UserRoleDetailService(ManagerRepository repository){
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        Manager manager = this.repository.findByName(name);
        return new User(manager.getName(), manager.getPassword(),
                        AuthorityUtils.createAuthorityList(manager.getRoles()));
    }
}
