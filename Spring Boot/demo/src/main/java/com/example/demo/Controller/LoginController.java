package com.example.demo.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @GetMapping({"/", "/login"})
    public String mostrarLogin() {
        return "login";
    }

    @PostMapping("/login")
    public String procesarLogin(
            @RequestParam String username,
            @RequestParam String password,
            Model model) {

        boolean usuarioValido = username.equals("admin") ||
                        username.equals("user") ||
                        username.equals("profesor");

        boolean passwordValido = password.equals("ant.design");

        if (usuarioValido && passwordValido) {
            model.addAttribute("usuario", username);
            return "redirect:/user/home";
        }

        model.addAttribute("error", "Usuario o contraseña incorrectos");
        return "login";
    }

    


}