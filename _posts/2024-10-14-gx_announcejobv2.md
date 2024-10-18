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
    cooldown = 30, -- Cooldown seconds
    jobs = {
        ['police'] = { -- job
            profile = "https://pbs.twimg.com/media/EiIv4AZXkAE8YZ0.png", -- nil | 'url'
            title = "POLICE DEPARTMENT", -- 'text'
            timer = {
                duration = 25, -- Duration of announce in seconds
            },
            sound = {
                sound = "./music/2.wav", -- nil | ./music/1.wav | Add sound here => gx_announcejobv2\web\music\1.wav
                soundVolume = 0.2, -- recommend 0.2  | Volume min 0.1 max 0.5
            },
            style = {
                theme = 2, -- 1 | 2 | 3 | 4 | 5 | 6 | 7  
                sizeNui = 1.2, -- Aument Nui : min 0.5 max 1.5 
                position = "topCenter", -- topLeft | topRight | middleLeft | middleRight | bottomLeft | bottomRight | center | topCenter | bottomCenter
                background = "https://t3.ftcdn.net/jpg/06/35/76/34/360_F_635763412_CUTNSVV8R7s5yPBsNwdRS5YuRGbojFav.jpg", -- 'url' | 'color' | 'rgb' | 'rgba' | '#HEX'  
                colors = {
                    color1 ="rgba(208, 182, 88, 0.8)", -- 'color' | 'rgb' | 'rgba' | '#HEX'
                    title = "rgba(190, 162, 61, 0.8)", -- 'color' | 'rgb' | 'rgba' | '#HEX'
                    description= "white",  -- 'color' | 'rgb' | 'rgba' | '#HEX'
                },
                anim = {
                    _start = "swing", -- effect start nui : https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                    _end   = "wobble", -- effect end nui: https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                },
            }
        },
        ['ambulance'] = {
            profile = "https://firelandsambulance.org/wp-content/uploads/2013/04/Firelands-EMT-Patch-1.png", 
            title = "LOS SANTOS AMBULANCE", 
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav", 
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2,
                position= "topCenter", 
                background= "rgba(216, 22, 30, 0.7)",
                colors = { 
                    color1 ="#D63438", 
                    title = "#1B1A6C",
                    description= "#FFFFFF",  
                },
                anim = {
                    _start = "swing",
                    _end   = "wobble", 
                },
            }
        },
        ['mechanic'] = { 
            profile = "https://static.wikia.nocookie.net/logopedia/images/6/69/Los_Santos_Customs_%28Alt%29.png", 
            title = "LOS SANTOS CUSTOMS", 
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2,
                sizeNui= 1.2,
                position= "topCenter", 
                background= "rgba(31, 26, 90, 0.7)", 
                colors = { 
                    color1 ="rgba(31, 26, 90, 0.9)", 
                    title = "#FFF000",
                    description= "#FFFFFF",  
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble", 
                },
            }
        },
        ['taxi'] = { 
            profile = "https://i.servimg.com/u/f11/19/77/62/97/84620_10.png",
            title = "DOWNTOWN CAB CO.", 
            timer = {
                duration = 25,
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2, 
                position= "topCenter", 
                background= "rgba(255, 204, 0, 0.7)",   
                colors = { 
                    color1 ="rgba(255, 204, 0, 0.9)", 
                    title = "#010306", 
                    description= "#FD430A",  
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble", 
                },
            }
        },
        ['bahama'] = {
            profile = "https://static.wikia.nocookie.net/igniteroleplay/images/7/7b/BMsPinkLogo.png", 
            title = "BUSINESS: BAHAMA MAMAS",
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2, 
                position= "topCenter",
                background= "black", 
                colors = { 
                    color1 ="rgba(245, 40, 145, 0.8)", 
                    title = "rgba(245, 40, 145, 0.8)", 
                    description= "white", 
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble",
                },
            }
        },
    }
}

Translate = {
    ["cooldown"] = "You must wait %s second/s",
    ["notJob"] = "Your Work is not allowed to use this",
}

Webhook = "https://discord.com/api/webhooks/1296593670061162517/RteLrlyJOEWJqthIGoJmSBSdvL616gDA92D7g2xQF6zbudeICZRtaEUUVuakzUvuD7mx" -- nil | webhook

```

## Exports

If you want to be able to use the ad exports, you must refer to gx_announcejobv2/shared/custom.lua, to see what designs there are, and how to add more!
```ruby
> Using in client
    exports.gx_announcejobv2:Announce({
        theme = 'custom', 
        profile = 'https://media.tenor.com/dE-mXqu8cnMAAAAj/anonymous-man.gif',
        title = 'tittle',
        description = "this is a message", 
        timer = {
            duration = 10, 
        },
        sound = {
            sound = "./music/2.wav", 
            soundVolume = 0.2, 
        },
        style = {
            background = "white",
            sizeNui= 1.5,
            position= "topCenter", 
            anim = {
                _start = "swing", 
                _end   = "wobble", 
            }, 
        }
    })
> Using in server
    TriggerClientEvent('gx_announcejobv2:Announce', source, {
        theme = 'anonymous', -- gx_announcejobv2/shared/custom.lua
        profile = 'https://media.tenor.com/dE-mXqu8cnMAAAAj/anonymous-man.gif', -- nil | 'url'
        title = 'tittle', -- 'text'
        description = "this is a message", -- 'text'
        timer = {
            duration = 10, -- Duration of announce in seconds
        },
        sound = {
            sound = "./music/2.wav", -- nil | ./music/1.wav | Add sound here => gx_announcejobv2\web\music\1.wav
            soundVolume = 0.2, -- recommend 0.2  | Volume min 0.1 max 0.5
        },
        style = {
            background = "white", -- 'url' | 'color' | 'rgb' | 'rgba' | '#HEX'  
            sizeNui= 1.5, -- Aument Nui : min 0.5 max 1.5 
            position= "topCenter", -- topLeft | topRight | middleLeft | middleRight | bottomLeft | bottomRight | center | topCenter | bottomCenter
            anim = {
                _start = "swing", -- effect start nui : https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                _end   = "wobble", -- effect end nui: https://www.theappguruz.com/tag-tools/web/CSSAnimations/
            }, 
        }
    })
```

## Preview

<div class="gallery-box">
<div class="gallery">
    <img src="https://i.ibb.co/d0dcFk2/image.webp"/>
    <img src="https://i.ibb.co/pz6n6sw/image.webp">
    <img src="https://i.ibb.co/j8cwVWd/1.png"/>
    <img src="https://i.ibb.co/g9nD26p/image.webp">
    <img src="https://i.ibb.co/Wx4XxLF/image.webp">
    <img src="https://i.ibb.co/4VZ9b31/image.webp">
    <img src="https://i.ibb.co/z5zNRMH/image.webp">
    <img src="https://i.ibb.co/1RxfNF1/image.webp">
    <img src="https://i.ibb.co/pZJ4RNx/image.webp">
    <img src="https://i.ibb.co/N6WP0CP/image.webp">
    <img src="https://i.ibb.co/xLXQ9Tc/image.webp">
    <img src="https://i.ibb.co/wRJMw5G/image.webp">
    <img src="https://i.ibb.co/qFfC2yX/image.webp">
    <img src="https://i.ibb.co/XpyKcSZ/image.webp">
</div>
<em><a>ScreenShot of gx_announcejobv2</a></em>
</div>

![](https://i.ibb.co/sv218Cr/image.webp)
*Log Discord*