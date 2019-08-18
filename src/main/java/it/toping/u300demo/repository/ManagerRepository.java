package it.toping.u300demo.repository;

import it.toping.u300demo.domain.Manager;
import org.springframework.data.repository.Repository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface ManagerRepository extends Repository<Manager, Long> {
    Manager save(Manager manager);
    Manager findByName(String name);
}
