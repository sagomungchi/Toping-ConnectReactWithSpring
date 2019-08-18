package it.toping.u300demo.handler;

import it.toping.u300demo.domain.Manager;
import it.toping.u300demo.domain.User;
import it.toping.u300demo.repository.ManagerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler({User.class})
public class RestEventHandler {

    private final ManagerRepository managerRepository;

    @Autowired
    public RestEventHandler(ManagerRepository managerRepository){
        this.managerRepository = managerRepository;
    }

    @HandleBeforeCreate
    @HandleBeforeSave
    public void applyUserInformationUsingSecurityContext(User user){
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        Manager manager = this.managerRepository.findByName(name);
        if (manager == null){
            Manager newManager = Manager.getInstance();
            newManager.setName(name);
            newManager.setRoles(new String[]{"ROLE_MANAGER"});
            manager = this.managerRepository.save(newManager);
        }
        user.setManager(manager);
    }
}
