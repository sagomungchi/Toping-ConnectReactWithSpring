package it.toping.u300demo.repository;

import it.toping.u300demo.domain.User;
import org.springframework.data.repository.CrudRepository;

public interface UserRepository extends CrudRepository<User, Long> {
}
