package ru.myguitarlib.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

//@Controller
@RestController
@RequiredArgsConstructor
public class HomeController {

    @GetMapping("/index")
    public String index() {
        return "index 123";
    }
}
