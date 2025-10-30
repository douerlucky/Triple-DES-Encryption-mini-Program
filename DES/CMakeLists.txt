cmake_minimum_required(VERSION 4.0)
project(DES)

set(CMAKE_CXX_STANDARD 20)

add_executable(DES main.cpp
        utils.h
        des_process.h
        three_des.h
        cbc.h
        encryption_main.h
        my_io.h
        des_process.cpp
        encryption_main.cpp
        my_io.cpp
        three_des.cpp
        utils.cpp
        cbc.cpp
)
