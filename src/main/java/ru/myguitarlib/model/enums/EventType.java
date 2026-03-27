package ru.myguitarlib.model.enums;

public enum EventType {
    USER_REGISTRATION,
    USER_LOGIN,
    USER_LOGOUT,

    SONG_VIEW,
    SONG_EDIT,
    SONG_CREATE,
    SONG_IMPORT,
    SONG_DELETE,
    SONG_TONALITY_CHANGE,
    SONG_SEARCH,

    PAGE_VIEW,

    SONG_SHARED_VIEW  // Просмотр по публичной ссылке (анонимный пользователь)
}