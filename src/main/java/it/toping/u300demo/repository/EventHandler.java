package it.toping.u300demo.repository;

import it.toping.u300demo.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static it.toping.u300demo.config.WebSocketConfiguration.MESSAGE_PREFIX;


@Component
@RepositoryEventHandler(User.class)
public class EventHandler {

    private final SimpMessagingTemplate websocket;

    private final EntityLinks entityLinks;

    @Autowired
    public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }

    @HandleAfterCreate
    public void newUser(User user){
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/newUser", getPath(user)
        );
    }

    @HandleAfterDelete
    public void deleteuser(User user){
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/deleteUser", getPath(user)
        );
    }

    @HandleAfterSave
    public void updateuser(User user){
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/updateUser", getPath(user)
        );
    }

    private String getPath(User user) {
        return this.entityLinks.linkForSingleResource(user.getClass(),
                user.getId()).toUri().getPath();
    }

}
