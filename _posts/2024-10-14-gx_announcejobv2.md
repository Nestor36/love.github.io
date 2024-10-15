---
layout: post
title: gx_announcejobv2 
author: GuxFiz
date: 2024-10-14
tags: [FIVEM, ESX, QB, LUA, HTML, CSS, JS]
image: /assets/img/banners/gx_announcejobv2.png
description: "Fully configurable and modifiable worker announcement system for events on your server!"
---
# INSTALLATION

- **1** U NEED DOWNLOAD SCRIPT OR **[BUY HERE](https://guxfiz.tebex.io/category/standlone)**
- **2** DRAG AND DROP IN U RESOURCES 
- **3** IN U SERVER.CFG INSERT => 
<em>server.cfg</em>
```ruby
ensure gx_lib
ensure gx_announcejobv2
```

## Configuration
Easy Configuration!! 🐧

```
options = {
    Command = "anuncio", -- /anuncio Welcome testing
    jobs = {
        ['police'] = {
            profile = "https://eclipse-rp.net/images/desktop/social/fb-character.png",
            title = "POLICIA DE LOS SANTOS",
            timer = {
                duration = 10,-- seconds
                cooldown = 0,-- seconds
            },
            sound = {
                sound = "./music/2.wav", -- none
                soundVolume = 0.2,
            },
            style = {
                theme = 1,
                sizeNui= 1.5, 
                position= "topCenter",
                background= "https://c4.wallpaperflare.com/wallpaper/606/513/92/grand-theft-auto-gta-police-cops-hd-wallpaper-preview.jpg",
                colors = { 
                    color1 ="#0077fff8", 
                    title = "blue", 
                    description= "white",
                },
                anim = {
                    _start = "swing",
                    _end   = "wobble",
                },
            }
        },
        ['ambulance'] = {
            profile = "https://clipart-library.com/data_images/203064.png",
            title = "EMS DE LOS SANTOS",
            timer = {
                duration = 5,-- seconds
                cooldown = 0,-- seconds
            },
            sound = {
                sound = "./music/1.wav",
                soundVolume = 0.2,
            },
            style = {
                theme = 1,
                sizeNui= 1.5, 
                position= "topCenter",
                background= "https://store-images.s-microsoft.com/image/apps.65175.66515090704019777.c95568d5-8811-4e30-a0f2-3ac354b35880.ebbf3fdc-573d-4960-9d0c-7aec0f854ff3?q=90&w=480&h=270",
                colors = { 
                    color1="#0077fff8", 
                    title = "#0077fff8", 
                    description= "#fff",
                },
                anim = {
                    _start = "swing",
                    _end   = "wobble",
                },
            }
        },
        ['taxi'] = {
            profile = "https://clipart-library.com/data_images/203064.png",
            title = "POLICIA DE LOS SANTOS",
            timer = {
                duration = 1,-- seconds
                cooldown = 30,-- seconds
            },
            sound = {
                sound = "./music/1.wav",
                soundVolume = 0.2,
            },
            style = {
                theme = 1,
                sizeNui= 1.5, 
                position= "topCenter",
                background= "https://store-images.s-microsoft.com/image/apps.65175.66515090704019777.c95568d5-8811-4e30-a0f2-3ac354b35880.ebbf3fdc-573d-4960-9d0c-7aec0f854ff3?q=90&w=480&h=270",
                colors = { 
                    color1="#0077fff8", 
                    title = "#0077fff8", 
                    description= "#fff",
                },
                anim = {
                    _start = "swing",
                    _end   = "wobble",
                },
            }
        },
    }
}
```

## Exports

If you want to be able to use the ad exports, you must refer to gx_announcejobv2/shared/custom.lua, to see what designs there are, and how to add more!
```ruby
    exports.gx_announcejobv2:Announce({
        theme = 'custom',
        profile = 'https://media.tenor.com/dE-mXqu8cnMAAAAj/anonymous-man.gif',
        title = 'tittle',
        description = "this is a message",
        timer = {
            duration = 10,-- seconds
            cooldown = 0,-- seconds
        },
        sound = {
            sound = "./music/2.wav",
            soundVolume = 0.2,
        },
        style = {
            background = "white",
            theme = 1,
            sizeNui= 1.5, 
            position= "center",
            anim = {
                _start = "swing",
                _end   = "wobble",
            },
        }
    })
```

## Preview

<div class="gallery-box">
<div class="gallery">
    <img src="https://i.ibb.co/xHDPS5d/imagen.png">
</div>
<em>ScreenShot of gx_announcejobv2</a></em>
</div>