package it.toping.u300demo.repository;

import it.toping.u300demo.domain.User;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

@PreAuthorize("hasRole('ROLE_MANAGER')")
public interface UserRepository extends PagingAndSortingRepository<User, Long> {

    @Override
    @PreAuthorize("#user?.manager == null or #user?.manager?.name == authentication?.name")
    User save(@Param("user") User user);

    @Override
    @PreAuthorize("@userRepository.findById(#id)?.manager?.name == authentication?.name")
    void deleteById(@Param("id") Long id);

    @Override
    @PreAuthorize("#user?.manager?.name == authentication?.name")
    void delete(@Param("user") User user);
}
