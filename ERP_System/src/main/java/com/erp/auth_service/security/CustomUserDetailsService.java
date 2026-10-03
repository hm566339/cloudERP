package com.erp.auth_service.security;

import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;



import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail)
            throws UsernameNotFoundException {
        List<User> users = userRepository
                .findAllByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail.trim(), usernameOrEmail.trim());

        if (users == null || users.isEmpty()) {
            throw new UsernameNotFoundException("User not found");
        }

        // Prioritize root company (000000) or active account if multiple exist across tenants
        User user = users.stream()
                .filter(u -> u.getCompany() != null && "000000".equals(u.getCompany().getCompanyCode()))
                .findFirst()
                .orElse(users.get(0));

        return new CustomUserDetails(user);
    }
}