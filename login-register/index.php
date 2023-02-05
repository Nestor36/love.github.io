<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>GuxFiz</title>
	<link rel="stylesheet" href="style.css">
</head>
<script> 
	function ventanaSecundaria (URL){ 
	window.open(URL,"ventana1","width=10,height=10,scrollbars=no, toolbar=no, locationbar=no, tittlebar=no, status=yes") 
	}
</script>
<body>

<div>
	<button  align="center" class="glow-on-hover" type="button" onclick="javascript:ventanaSecundaria('http://22203.live.streamtheworld.com/CRP_PLA_SC')">▶</button>
</div>
	<div class="box">
		<form method="post" autocomplete="off" action="login.php">
			
			<h2 class="button-login">Login</h2>
			<?php
			
			if(isset($_GET["error"]) and $_GET["error"] == 1) 
			{
				
				echo "<div style='color:red' align='center'>Usuario o contraseña incorrecta </div>";
				echo ' <meta http-equiv="refresh" content="50;URL=\'index.php\'" />    ';
				
			}
			?>
			<div class="inputBox">
				<input type="text" name="datausername" required="required">
				<span>Username</span>
				<i></i>
			</div>
			<div class="inputBox">
				<input type="password" name="datapassword" required="required">
				<span>Password</span>
				<i></i>
			</div>
			<div class="links">
				
				<a href="#">Olvidé mi contraseña</a>
				<a href="register.php">Registrarse</a>
			</div>

			<input type="submit" value="Login">

		</form>
	</div>
	<div>
<tatble>
	<tr><td><p class="oblique" style="color:white">Contador de Visitantes</p></td></tr>
		</table>
<div align="center" id="sfc5qf557xw2zfrn6ushcattf5k4bzltkrr"></div>
<script type="text/javascript" src="https://counter4.optistats.ovh/private/counter.js?c=5qf557xw2zfrn6ushcattf5k4bzltkrr&down=async" async></script>
<noscript><img src="https://counter4.optistats.ovh/private/contadorvisitasgratis.php?c=5qf557xw2zfrn6ushcattf5k4bzltkrr" border="0" alt="contador de visitas gratis"></a></noscript>
		</div>

</body>
</html>




<!--

Enlace para ofuscar code - https://bloggerwebtools.blogspot.com/2018/03/ofuscador-de-codigo-html-blogger.html

https://www.protegerhtml.com/index.php

-->