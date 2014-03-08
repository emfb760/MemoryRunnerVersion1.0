$(document).ready(function() {

// Global variables used to handle the boundary of the window
left_boundary = 0;
right_boundary = $(document).width();
top_boundary = 0;
bottom_boundary = $(document).height();

// Flag to keep track if there is an active XBox controller connected
xBoxControllerActive = false;

// Array to hold information about platforms on the scene, used for collision detection and rendering (boundaries are also added to this array)
levelPlatforms = new Array();

// Array to hold information about all platforms in the level (once a platform is sent to levelPlatforms, it is removed from allPlatforms)
allPlatforms = new Array();

// Array to store and handle bullets animations
bullets = new Array();

// game_speed of bullets
bullet_game_speed = 20;

// Variable to handle assigning unique IDs to bullets
bullet_id = 0;

// Variables for size of bullets
bullet_height = 5;
bullet_width = 10;

// Frequency of shooting bullets
bullet_delay = 15;
bullet_delay_counter = 0;
bullet_delay_flag = true;

// Variable to change shooting mode (1 = shoot in direction of mouse, 0 = shoot in direction the player is facing)
shooting_mode = 0;

// Variable to change the difficulty of the game (0 = easy, 1 = hard)
difficulty = 1;

// Variable to see if first gem has been created
first_gem = false;

// Variable to set speed of platforms
game_speed = 1;

// Variable to hold player score
playerScore = 0;


// Variable to hold coin counter and selected coin
coin_counter = 0;
coin_selected = -1;

// Variable to show if a gun is in screen
gun_on_screen = false;

// Variable to hold gun counter and selected gun
gun_counter = 0;


// sparkle animation for grabbing gem
sparkleAnim = false;
sparkleAnimIndex = 1;
$('#container').append('<div id="sparkleAnim" style="position: absolute; left: 100; top: 500;"><img /></div>');

// explosion animation for shooting gem
explosionAnim = false;
explosionAnimIndex = 1;
explosion_xcoor = 0;
explosion_ycoor = 0;
$('#container').append('<div id="explosionAnim" style="position: absolute; left: 100; top: 500; width:64px; height: 64px;"></div>');


// Class to handle player
player = {
	width: 50,
	height: 50,
	x_pos: 0,
	y_pos: 0,
	walk_game_speed: 15,
	dash_move: 0,
	dash_up: 0,
	flame_animation_counter: -1,
	flame_animation_time: 10,
	flame_animation_dir: -1,	// 1 = right, 0 = left
	flame_width: 150,
	moving_right: false,
	moving_left: false,
	jumping: false,
	falling: false,
	starting_jump_game_speed: 30,
	current_jump_game_speed: 0,
	gravity: 2,
	terminal_velocity: -30,
	platform_standing_on: 0,	// Needed to handle the case when player walks off of a ledge
	facing: 1,	// 1 = right, 0 = left
	moveRight: function() {
		if( !this.moving_right ) this.moving_right = true;
	},
	stopMoveRight: function() {
		if( this.moving_right ) this.moving_right = false;
	},
	moveLeft: function() {
		if( !this.moving_left ) this.moving_left = true;
	},
	stopMoveLeft: function() {
		if( this.moving_left ) this.moving_left = false;
	},
	jump: function() {
		if( !this.jumping && !this.falling ) {
			this.jumping = true;
			this.current_jump_game_speed = this.starting_jump_game_speed;
			$.playSound('Sounds/jump');
		}
	},
	shoot: function(mouse_x_pos) {
		if (bullet_delay_flag) {
			bullet_delay_flag = false;
			$.playSound('Sounds/shot');
			if( shooting_mode == 1 && mouse_x_pos != -1) {
				if( mouse_x_pos > this.x_pos+this.width/2 ) {
					bullets.push({id: bullet_id++, x_pos: this.x_pos+this.width, y_pos: this.y_pos+this.height/2-bullet_height/2, dir: 1, exists: false});
				}
				else {
					bullets.push({id: bullet_id++, x_pos: this.x_pos-bullet_width, y_pos: this.y_pos+this.height/2-bullet_height/2, dir: 0, exists: false});
				}
			}
			else {
				if( this.facing == 1 ) {
					bullets.push({id: bullet_id++, x_pos: this.x_pos+this.width, y_pos: this.y_pos+this.height/2-bullet_height/2, dir: this.facing, exists: false});
				}
				else {
					bullets.push({id: bullet_id++, x_pos: this.x_pos-bullet_width, y_pos: this.y_pos+this.height/2-bullet_height/2, dir: this.facing, exists: false});
				}
			}
		}
	},
	dash: function() {
		if( this.moving_left || this.moving_right ) {
			$.playSound('Sounds/dash');
			this.dash_move = 140;
		}
		else if( this.jumping ) {
			$.playSound('Sounds/dash');
			this.dash_up = 180;
		}
	}
};

lava1_x_pos = -15;
lava1_dir = 1;
lava2_x_pos = 0;
lava2_dir = 0;

function buildLava() {
	$('#container').append('<div id="lava2" style="position:absolute; top: '+(bottom_boundary-30).toString()+'; left: 0;"><img src="Textures/lava2.png" style="width:'+(right_boundary+15).toString()+'" /></div>');
	$('#container').append('<div id="lava1" style="position:absolute; top: '+(bottom_boundary-30).toString()+'; left: -15;"><img src="Textures/lava1.png" style="width:'+(right_boundary+15).toString()+'" /></div>');
}

function destroyLava() {
	$('#lava1').remove();
	$('#lava2').remove();
}

// Create platform objects to represent the ground, ceiling, left wall, and right wall borders (edges of browser window)
levelPlatforms.push({id: -1, x_max: right_boundary, x_min: left_boundary, y_min: bottom_boundary, y_max: bottom_boundary}); // Ground Plane
levelPlatforms.push({id: -2, x_max: left_boundary, x_min: left_boundary, y_min: top_boundary, y_max: bottom_boundary});		// Left Wall
levelPlatforms.push({id: -3, x_max: right_boundary, x_min: right_boundary, y_min: top_boundary, y_max: bottom_boundary}); 	// Right Wall
levelPlatforms.push({id: -4, x_max: right_boundary, x_min: left_boundary, y_min: top_boundary, y_max: top_boundary});		// Ceiling Plane
		

// Create the player element and position the player at the start of the level
function buildPlayer() {
	$('#container').append('<div id="player" style="position: absolute; left: '+(player.x_pos).toString()+'; top: '+(player.y_pos).toString()+';"><img src="Textures/box_player_shaded.png" /></div>');
	player.dash_move = 0;
	player.moving_left = false;
	player.moving_right = false;
	player.jumping = false;
	player.falling = true;
	player.current_jump_game_speed = 0;
}

// Removes the player object from the scene
function destroyPlayer() {
	$('#player').remove();
}

function destroyDashFlame() {
	if( player.dash_animation_counter != -1 ) {
		player.dash_animation_count = -1;
		player.flame_animation_dir = -1;
		$('#dash_flame').remove();
	}
}

// Variable to handle assigning unique IDs to platforms
platform_id = 0;

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

sequence = shuffle(new Array(0,1,2));
sequencePtr = 0;

// Reads level file and builds the platforms
function buildLevel(filename) {

	$.ajax({
	  type: "POST",
	  url: 'readLevel.php',
	  data: {filename: filename},
	  success: function(output) {
			allPlatforms = [];
			platform_id = 0;
			playerScore = 0;
			if( difficulty == 0 ) game_speed = 1;
			else game_speed = 2;
			
			bullet_width = 10;
			bullet_height = 5;
			
			lines = output.split('\n');
			
			for( var i = 0; i < lines.length; ++i ) {
				allPlatforms.push(lines[i].split(' '));
			}
			
			player.x_pos = parseInt(allPlatforms[0][0],10);
			player.y_pos = bottom_boundary - parseInt(allPlatforms[0][1],10);
			allPlatforms.splice(0,1);
			
			for( var i = 0; i < allPlatforms.length; ++i ) {
				if( bottom_boundary - (parseInt(allPlatforms[i][1],10) - parseInt(allPlatforms[i][3],10))  > 0 ) {	// Only create platforms if they are in the scene window
					createPlatform(parseInt(allPlatforms[i][0],10), parseInt(allPlatforms[i][1],10), parseInt(allPlatforms[i][2],10), parseInt(allPlatforms[i][3],10));
					allPlatforms.splice(i,1);	// Platform was transferred to levelPlatforms, so we can remove it from allPlatforms
					--i;						// Decrement i to make up for the removal of the platform
				}
			}
	  },
	  complete: function() {
		buildPlayer();
		buildLava();
	  }
	});

}

// Removes all platforms of the currently loaded level then call destroyPlayer and destroyBullets
function destroyLevel() {
	$('.gem, .coin, .gun').remove();
	first_gem = false;
	for( var i = 4; i < levelPlatforms.length; ++i ) {
		$('#platform_'+(levelPlatforms[i].id).toString()).remove();
	}
	levelPlatforms.splice(4,levelPlatforms.length-4);
	
	destroyPlayer();
	destroyBullets();
	destroyDashFlame();
	destroyLava();
	destroyExplosion();
}

// Creates a single platform from the level
function createPlatform(x_pos, y_pos, width, height) {
	var gem = -1
	var d = new Date().getTime();
	if (d % 10 > 1 && first_gem) {	// 60% chance
		gem = Math.floor((Math.random()*3)+0);
	}
	levelPlatforms.push({id: platform_id++, x_max: x_pos+width, x_min: x_pos, y_min: bottom_boundary-y_pos, y_max: bottom_boundary-y_pos+height});
	$('#container').append('<div class="platform" id="platform_'+(levelPlatforms[levelPlatforms.length - 1].id).toString()+'" style="position: absolute; left: '+(levelPlatforms[levelPlatforms.length - 1].x_min).toString()+'; top: '+(levelPlatforms[levelPlatforms.length - 1].y_min).toString()+';"><img src="Textures/platform_shaded.png" width="'+width+'" height="'+height+'" /></div>');
	switch(gem) {
		case 0:
			$('#container').append('<div data-gem="' + gem + '" class="gem" style="position: absolute; left: '+(levelPlatforms[levelPlatforms.length - 1].x_min + (200-25)/2).toString()+'; top: '+(levelPlatforms[levelPlatforms.length - 1].y_min - 25 - 7).toString()+';"><img src="Textures/circle_gem.png" width="25" height="25" /></div>');
			break;
		case 1:
			$('#container').append('<div data-gem="' + gem + '" class="gem" style="position: absolute; left: '+(levelPlatforms[levelPlatforms.length - 1].x_min + (200-25)/2).toString()+'; top: '+(levelPlatforms[levelPlatforms.length - 1].y_min - 25 - 7).toString()+';"><img src="Textures/diamond_gem.png" width="25" height="25" /></div>');
			break;
		case 2:
			$('#container').append('<div data-gem="' + gem + '" class="gem" style="position: absolute; left: '+(levelPlatforms[levelPlatforms.length - 1].x_min + (200-25)/2).toString()+'; top: '+(levelPlatforms[levelPlatforms.length - 1].y_min - 25 - 7).toString()+';"><img src="Textures/square_gem.png" width="25" height="25" /></div>');
			break;
		case -1:
		default:
			break;			
	}
	first_gem = true;
}

// Removes a single platform from the level
function destroyPlatform(index, id) {
	if( id >= 4 && id < levelPlatforms.length ) {
		$('#platform_'+(levelPlatforms[id]).toString()).remove();
		levelPlatforms.splice(index,1);
	}
}


// Removes all bullets remaining in the scene
function destroyBullets() {
	for( var i = 0; i < bullets.length; ++i ) {
		$('#bullets_'+(bullets[i].id).toString()).remove();
	}
	bullets.splice(0,bullets.length);
}

// Removes explosion animation if still going when player loses
function destroyExplosion() {
	explosionAnim = false;
	explosionAnimIndex = 1;
	explosion_xcoor = 0;
	explosion_ycoor = 0;
	$('#explosionAnim').animate({
		opacity: 0.0,
		}, 400, function() {
	});
}

// Creates layout for main menu state
function createMainMenuButtons() {
	$('#container').append('<div id="logo" style="margin: 300px auto 0px auto; text-align: center;"><image src="Textures/logo.png" /></div>');
	$('#container').append('<button id="play_button" class="fancy_button" style="margin: 40px auto 0px auto; width:200px;">Play</button>');
	$('#play_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.LoadLevel; });
	$('#container').append('<button id="options_button" class="fancy_button" style="margin: 10px auto 0px auto; width:200px;">Options</button>');
	$('#options_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.CreateOptionsMenu; });
	
	if( !xBoxControllerActive ) {
		$('#container').append('<p id="xbox_hint" style="margin-top: 50px; text-align: center; color: #008; ">HINT: To activate XBox360 controller, press A on your XBox controller</p>');
	}
	else {
		$('#play_button').toggleClass("highlight_option", true);
		$('#options_button').toggleClass("highlight_option", false);
	}
}

// Removes DOM elements used in the main menu state
function destroyMainMenuButtons() {
	$('#logo').remove();
	$('#play_button').remove();
	$('#options_button').remove();
}

// Creates layout for the options menu state
function createOptionsMenuButtons() {
	$('#container').append('<button id="main_menu_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-150).toString()+'; top: 10;">Main Menu</button>');
	$('#main_menu_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.BackToMainMenu; });

	$('#container').append('<p id="options_text" style="text-align: center; margin-top: 100px; margin-bottom: 0px;" class="title">Options</p>');
	$('#container').append('<p id="shoot_option_text" style="text-align: center; margin-top: 50px; margin-bottom: 0px;" class="subtitle">Shooting Style:</p>');
	$('#container').append('<button id="shoot_option_mouse" class="fancy_button" style="margin: 15px auto 0px auto;">Mouse Directional</button>');
	$('#container').append('<button id="shoot_option_facing" class="fancy_button" style="margin: 10px auto 0px auto;">Player Directional</button>');
	$('#container').append('<p id="shoot_explanation" style="text-align: center; margin-top: 35px; font-size: 18px; color: #800" ></p>');
	$('#shoot_option_mouse').on('click', function() { $('#shoot_option_mouse').toggleClass("selected_option", true); $('#shoot_option_facing').toggleClass("selected_option", false); shooting_mode = 1; $('#shoot_explanation').html('Player shoots in the direction of the mouse cursor regardless of the direction the player is facing'); });
	$('#shoot_option_facing').on('click', function() { $('#shoot_option_facing').toggleClass("selected_option", true); $('#shoot_option_mouse').toggleClass("selected_option", false); shooting_mode = 0; $('#shoot_explanation').html('Player shoots in the direction the player is facing'); });

	$('#container').append('<p id="difficulty_option_text" style="text-align: center; margin-top: 50px; margin-bottom: 0px;" class="subtitle">Difficulty:</p>');
	$('#container').append('<button id="difficulty_option_easy" class="fancy_button" style="margin: 15px auto 0px auto;">Easy</button>');
	$('#container').append('<button id="difficulty_option_hard" class="fancy_button" style="margin: 10px auto 0px auto;">Hard</button>');
	$('#container').append('<p id="difficulty_explanation" style="text-align: center; margin-top: 35px; font-size: 18px; color: #800" ></p>');
	$('#difficulty_option_easy').on('click', function() { $('#difficulty_option_easy').toggleClass("selected_option", true); $('#difficulty_option_hard').toggleClass("selected_option", false); difficulty = 0; $('#difficulty_explanation').html('Simple level. Slower Game Speed. Wall collision does not stun your player.'); });
	$('#difficulty_option_hard').on('click', function() { $('#difficulty_option_hard').toggleClass("selected_option", true); $('#difficulty_option_easy').toggleClass("selected_option", false); difficulty = 1; $('#difficulty_explanation').html('Challenging level. Faster Game Speed. Wall collision stuns your player.'); });

	
	if( shooting_mode == 1 ) {
		$('#shoot_option_mouse').toggleClass("selected_option", true);
		$('#shoot_option_facing').toggleClass("selected_option", false);
		$('#shoot_explanation').html('Player shoots in the direction of the mouse cursor regardless of the direction the player is facing');
	}
	else {
		$('#shoot_option_mouse').toggleClass("selected_option", false);
		$('#shoot_option_facing').toggleClass("selected_option", true);
		$('#shoot_explanation').html('Player shoots in the direction the player is facing');
	}
	
	if( difficulty == 0 ) {
		$('#difficulty_option_easy').toggleClass("selected_option", true);
		$('#difficulty_option_hard').toggleClass("selected_option", false);
		$('#difficulty_explanation').html('Simple level. Slower Game Speed. Wall collision does not stun your player.');
	}
	else {
		$('#difficulty_option_easy').toggleClass("selected_option", false);
		$('#difficulty_option_hard').toggleClass("selected_option", true);
		$('#difficulty_explanation').html('Challenging level. Faster Game Speed. Wall collision stuns your player.');
	}
	
	$('#container').append('<div id="key_mappings" style="margin: 100px auto 0px auto; text-align: center;"><p class="subtitle">Key Mappings:</p><table style="display: inline; margin: 20px auto 0px auto;"><tr><td class="table_title">Function</b></td><td class="table_title">Keyboard/Mouse</td><td class="table_title">XBox Controller</td></tr><tr><td>Move Left</td><td>A</td><td>Left (Analog/D-pad)</td></tr><tr><td>Move Right</td><td>D</td><td>Right (Analog/D-pad)</td></tr><tr><td>Jump</td><td>Space</td><td>A</td></tr><tr><td>Dash</td><td>LShift</td><td>RT</td></tr><tr><td>Shoot</td><td>LMB</td><td>X</td></tr></table></div>');

	if( xBoxControllerActive ) {
		$('#shoot_option_mouse').toggleClass("highlight_option", true);
		$('#shoot_option_facing').toggleClass("highlight_option", false);
		$('#difficulty_option_easy').toggleClass("highlight_option", false);
		$('#difficulty_option_hard').toggleClass("highlight_option", false);
		option_selected = 0;
	}
}

// Removes DOM elements used in the options menu state
function destroyOptionsMenuButtons() {
	$('#main_menu_button').remove();
	$('#options_text').remove();
	$('#shoot_option_text').remove();
	$('#shoot_option_mouse').remove();
	$('#shoot_option_facing').remove();
	$('#shoot_explanation').remove();
	$('#difficulty_option_text').remove();
	$('#difficulty_option_easy').remove();
	$('#difficulty_option_hard').remove();
	$('#difficulty_explanation').remove();
	$('#key_mappings').remove();
}


function createPreLevelVisual() {
	sequence = shuffle(new Array(0,1,2));
	sequencePtr = 0;

	str = '<div class="sequence" style="margin: 300px auto 0px auto; text-align: center;"><p style="margin: 40px auto; font-size: 32px;">Collect gems in this sequence</p>';
	for( var i = 0; i < sequence.length; ++i ) {
		shape = "";
		switch(sequence[i]) {
			case 0:
				shape = "circle_gem_large.png";
				break;
			case 1:
				shape = "diamond_gem_large.png";
				break;
			case 2:
				shape = "square_gem_large.png";
				break;
		}
		str += '<div style="display: inline; margin: 0px 25px;" ><img src="Textures/'+shape+'" /></div>';
	}
	str += '</div>';
	
	$('#container').append(str);
	
	$.post("get_scores.php", {difficulty:difficulty}, function(output) {
		top_scores = [];
		top_scores.push(new Array(output[0].name,output[0].score));
		top_scores.push(new Array(output[1].name,output[1].score));
		top_scores.push(new Array(output[2].name,output[2].score));
	}, "json");
	
}

function destroyPreLevelVisual() {
	$('.sequence').remove();
}

top_scores = new Array();

// Creates Buttons used in the play level state
function createPlayLevelButtons() {
	$('#container').append('<button id="main_menu_button" class="fancy_button" style="opacity: .2; position: absolute; left: '+(right_boundary-150).toString()+'; top: 10;">Main Menu</button>');
	$('#main_menu_button').on({
		'click': function() { prev_game_state = current_game_state; current_game_state = gameStates.BackToMainMenu; },
		'mouseenter': function() {$(this).css("opacity", "1");},
		'mouseleave': function() {$(this).css("opacity", ".2");}
	});
	$('#container').append('<button id="restart_button" class="fancy_button" style="opacity: .2; position: absolute; left: '+(right_boundary-150-150).toString()+'; top: 10;">Restart</button>');
	$('#restart_button').on({
		'click': function() { prev_game_state = current_game_state; current_game_state = gameStates.ReloadLevel; },
		'mouseenter': function() {$(this).css("opacity", "1");},
		'mouseleave': function() {$(this).css("opacity", ".2");}		
	});
	
	$('#container').append('<span id="hscore" style="opacity: .5; position: absolute; left: 50; top: 10; font-size: 32px;">Top Score: '+top_scores[0][1]+'</span>');
	$('#container').append('<span id="score" style="opacity: .5; position: absolute; left: 50; top: 40; font-size: 32px;">Score: 0</span>');
	
}

// Removes Buttons used in the play level state
function destroyPlayLevelButtons() {
	$('#main_menu_button').remove();
	$('#restart_button').remove();
}

// Creates Buttons used in the win level state
function createWinLevelButtons() {
	$('#container').append('<button id="main_menu_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-150).toString()+'; top: 10;">Main Menu</button>');
	$('#main_menu_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.BackToMainMenu; });
	$('#container').append('<button id="restart_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-150-150).toString()+'; top: 10;">Restart</button>');
	$('#restart_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.ReloadLevel; });
	
	$('#container').append('<div id="win_banner" style="margin: 300px auto 0px auto; text-align: center;"><image src="Textures/you_win.png" /></div>');
}

// Removes Buttons used in the win level state
function destroyWinLevelButtons() {
	$('#main_menu_button').remove();
	$('#restart_button').remove();
	$('#win_banner').remove();
}

// Creates Buttons used in the lose level state
function createLoseLevelButtons() {
	$('#container').append('<button id="main_menu_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-150).toString()+'; top: 10;">Main Menu</button>');
	$('#main_menu_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.BackToMainMenu; });
	$('#container').append('<button id="restart_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-150-150).toString()+'; top: 10;">Restart</button>');
	$('#restart_button').on('click', function() { prev_game_state = current_game_state; current_game_state = gameStates.ReloadLevel; });
	scores = "";
	
	for(var i=0; i < top_scores.length; ++i) {
		var name = top_scores[i][0];
		var score = top_scores[i][1];
		scores += '<div style="text-align: center; font-size: 22px; font-family: Georgia, Times, serif;">' + name + ':   '+score+'</div>';
	}
	
	appendStr = '<div id="lose_screen" > <div id="lose_banner" style="margin: 200px auto 0px auto; text-align: center;"><image src="Textures/you_lose.png" /></div><br><br><div style="text-align: center; font-size: 36px; font-family: Georgia, Times, serif; margin-bottom: 25px;">TOP SCORES</div>'+ scores +'<br><br>';
	
	if( playerScore > top_scores[2][1] ) {
		appendStr += '<div style="text-align: center;"><input id="uname" type="input" placeholder="Enter you name to submit your score"  style="width: 400px; height: 50px; font-family: Georgia, Times, serif; font-size: 18px;" /> </div> \
		<br><button id="submit_button" class="fancy_button" style="position: absolute; left: '+(right_boundary-200)/2+'; width: 200px;">Submit</button></div>';
	
		$('#container').append(appendStr);
		
		$('#submit_button').on('click', function() {
			var name = $("#uname").val();
			if( name == "" ) return;
			var btn = $(this);
			$.ajax({
				type: "POST",
				url:"send_score.php",
				data: {name:name, score:playerScore, difficulty:difficulty},
				beforeSend: function() {
					btn.html('Submitting...');
				},
				complete: function() {
					$('#uname').remove();
					$('#lose_screen').append('<p style="margin: 50px auto; text-align: center; color: #0A0; font-size: 22px;">Score Successfully Submitted</p>');
					btn.remove();
				}
			});
			
		});
	}
	else {
		appendStr += '</div>';
		$('#container').append(appendStr);
	}
	
	if( xBoxControllerActive ) {
		$('#main_menu_button').toggleClass("highlight_option", false);
		$('#restart_button').toggleClass("highlight_option", true);
	}
}

// Removes Buttons used in the lose level state
function destroyLoseLevelButtons() {
	$('#main_menu_button').remove();
	$('#restart_button').remove();
	$('#lose_screen').remove();
}


// Test collision with walls when moving to the right
function collisionXRight(x_old, x_new, y_min, y_max, platforms) {
	numPlatforms = platforms.length;
	
	for( var i = 0; i < numPlatforms; ++i ) {
		if( y_max > platforms[i].y_min && y_min < platforms[i].y_max ) {
			if( x_old <= platforms[i].x_min && x_new >= platforms[i].x_min ) {
				return i;
			}
		}
	}
	
	return -1;
}

// Test collision with walls when moving to the left
function collisionXLeft(x_old, x_new, y_min, y_max, platforms) {
	numPlatforms = platforms.length;
	
	for( var i = 0; i < numPlatforms; ++i ) {
		if( y_max > platforms[i].y_min && y_min < platforms[i].y_max ) {
			if( x_old >= platforms[i].x_max && x_new <= platforms[i].x_max ) {
				return i;
			}
		}
	}
	
	return -1;
}

// Test collision with platforms when jumping upward
function collisionYUp(x_min, x_max, y_old, y_new, platforms) {
	numPlatforms = platforms.length;
	
	for( var i = 0; i < numPlatforms; ++i ) {
		if( x_max > platforms[i].x_min && x_min < platforms[i].x_max ) {
			if( y_old >= platforms[i].y_max && y_new <= platforms[i].y_max ) {
				return i;
			}
		}
	}
	
	return -1;
}

// Test collision with platforms/ground when falling downward
function collisionYDown(x_min, x_max, y_old, y_new, platforms) {
	numPlatforms = platforms.length;
	
	for( var i = 0; i < numPlatforms; ++i ) {
		if( x_max > platforms[i].x_min && x_min < platforms[i].x_max ) {
			if( y_old <= platforms[i].y_min && y_new >= platforms[i].y_min ) {
				return i;
			}
		}
	}
	
	return -1;
}

// Detect if the player walked right off of the edge of the platform
function collisionWalkOffPlatformRight(x_new, platform) {
	return x_new >= platform.x_max;
}

// Detect if the player walked left off of the edge of the platform
function collisionWalkOffPlatformLeft(x_new, platform) {
	return x_new <= platform.x_min;
}

// Set window to call the update function every 30 ms (this is a little bit faster than 30fps)
window.setInterval(update, 30);

gameStates = {
	CreateMainMenu: 0,
	MainMenuWait: 1,
	BackToMainMenu: 2,
	CreateOptionsMenu: 3,
	OptionsMenuWait: 4,
	LoadLevel: 5,
	ReloadLevel: 6,
	CreatePreLevel: 7,
	PreLevelWait: 8,
	PlayLevel: 9,
	CreateWinLevel: 10,
	WinLevelWait: 11,
	CreateLoseLevel: 12,
	LoseLevelWait: 13
};

current_game_state = gameStates.CreateMainMenu;
prev_game_state = gameStates.CreateMainMenu;

pre_level_counter = 0;
pre_level_wait = 150;

// Game loop to handle animation
function update() {
	
	checkXBoxInput();
	
	
	switch(current_game_state) {
		case gameStates.CreateMainMenu:
			createMainMenuButtons();
			prev_game_state = current_game_state;
			current_game_state = gameStates.MainMenuWait;
			break;
		case gameStates.MainMenuWait:
			break;
		case gameStates.BackToMainMenu:
			if( prev_game_state == gameStates.OptionsMenuWait ) {
				destroyOptionsMenuButtons();
			}
			else if( prev_game_state == gameStates.LoseLevelWait ) {
				$('.playSound').remove();
				$('.music').remove();
				destroyLoseLevelButtons();
			}
			else {
				$('.playSound').remove();
				$('.music').remove();
				destroyPlayLevelButtons();
				destroyLevel();
			}
			prev_game_state = current_game_state;
			current_game_state = gameStates.CreateMainMenu;
			break;
		case gameStates.CreateOptionsMenu:
			destroyMainMenuButtons();
			createOptionsMenuButtons();
			prev_game_state = current_game_state;
			current_game_state = gameStates.OptionsMenuWait;
			break;
		case gameStates.OptionsMenuWait:
			break;
		case gameStates.LoadLevel:
			if( prev_game_state == gameStates.MainMenuWait ) {
				destroyMainMenuButtons();
			}
			$('.playSound').remove();
			$('.music').remove();
			$.playSound('Sounds/song');
			$('.music').volume -= 0.9;
			prev_game_state = current_game_state;
			current_game_state = gameStates.CreatePreLevel;
			break;
		case gameStates.ReloadLevel:
			$('#score, #hscore').remove();
			if( prev_game_state == gameStates.LoseLevelWait ) {
				destroyLoseLevelButtons();
			}
			else {
				destroyPlayLevelButtons();
				destroyLevel();
			}
			prev_game_state = current_game_state;
			current_game_state = gameStates.LoadLevel;
			break;
		case gameStates.CreatePreLevel:
			createPreLevelVisual();
			prev_game_state = current_game_state;
			current_game_state = gameStates.PreLevelWait;
			break;
		case gameStates.PreLevelWait:
			if( pre_level_counter > pre_level_wait ) {
				destroyPreLevelVisual();
				if( difficulty == 1 ) {
					buildLevel('Levels/hardlevel.lvl');
				}
				else {
					buildLevel('Levels/easylevel.lvl');
				}
				createPlayLevelButtons();
				prev_game_state = current_game_state;
				current_game_state = gameStates.PlayLevel;
				pre_level_counter = 0;
				$('#timeRemaining').remove();
			}
			else if( Math.floor((pre_level_wait - pre_level_counter) / 30) < 3 ) {
				timeRemaining = Math.floor((pre_level_wait - pre_level_counter)/30)+1;
				$('#timeRemaining').remove();
				$('#container').append('<p id="timeRemaining" style="text-align:center; font-size: 32px">'+timeRemaining.toString()+'</p>');
				pre_level_counter++;
			}
			else {
				pre_level_counter++;
			}
			break;
		case gameStates.PlayLevel:
			
			// Gun Creation

			if (!gun_on_screen) {
				gun_counter = Math.floor((Math.random()*310)+250);
				gun_on_screen = true;
			}
			
			gun_counter--;
			
			if (gun_counter <= 0 ) {
				var gun_y = Math.floor((Math.random()*player.y_pos)+50);
				var gun_x = Math.floor((Math.random()*right_boundary-50)+50);
				var new_gun = $('<div class="gun" style="display: none; position: absolute; left: '+gun_x+'px; top: '+gun_y+'px;"><image src="Textures/MP5.png" width=32 height=32/></div>');
				$('#container').append(new_gun);
				
				gun_on_screen = false;
				
				if ( !overlaps($("#player"), new_gun)) {
					$(".gem").each(function() {
						if (overlaps($(this), new_gun)) {
							new_gun.css("top", "0px");
							new_gun.remove();
						}
					});
					$(".platform").each(function() {
						if (overlaps($(this), new_gun)) {
						new_gun.css("top", "0px");
							new_gun.remove();
						}
					});
					new_gun.show();
				}
				else {
				new_gun.css("top", "0px");
					new_gun.remove();
				}
			}			
			
			// Gun Animation
			
			$('.gun').css( 'top', '+='+game_speed+'px' );
			
			$('.gun').each(function() {
				if ( overlaps($("#player"), $(this)) ) {
					//upgrade gun
					$.playSound('Sounds/collect_gun');
					bullet_height += 2;
					bullet_width = bullet_height*2;
					$(this).remove();
				}
				else {
					gunObj = $(this);
					$('.bullets').each(function() {
						if( overlaps($(this), gunObj) ) {
							//upgrade gun
							$.playSound('Sounds/collect_gun');
							bullet_height += 2;
							bullet_width = bullet_height*2;
							gunObj.remove();
						}
					});
				}
			});
			
			// Coin Creation
			
			if (coin_selected == -1) {
				coin_selected = Math.floor((Math.random()*3)+0);
				coin_counter = Math.floor((Math.random()*210)+150);
			}
			coin_counter--;
			
			if (coin_counter <= 0 ) {
				var coin_y = Math.floor((Math.random()*player.y_pos)+50);
				var coin_x = Math.floor((Math.random()*right_boundary-50)+50);
				var new_con = null;
				switch(coin_selected) {
					case 0:
						new_coin = $('<div class="coin" data-coin-value="50" style="display: none; position: absolute; left: '+coin_x+'px; top: '+coin_y+'px;"><image src="Textures/coin_50.png" width=50 height=50/></div>');
						$('#container').append(new_coin);
						break;
					case 1:
						new_coin = $('<div class="coin" data-coin-value="20" style="display: none; position: absolute; left: '+coin_x+'px; top: '+coin_y+'px;"><image src="Textures/coin_20.png" width=50 height=50/></div>');
						$('#container').append(new_coin);
						break;
					case 2:
						new_coin = $('<div class="coin" data-coin-value="10" style="display: none; position: absolute; left: '+coin_x+'px; top: '+coin_y+'px;"><image src="Textures/coin_10.png" width=50 height=50/></div>');
						$('#container').append(new_coin);
						break;
				
				}
				
				coin_selected = -1;
				if ( !overlaps($("#player"), new_coin)) {
					$(".gem").each(function() {
						if (overlaps($(this), new_coin)) {
							new_coin.css("top", "0px");
							new_coin.remove();
						}
					});
					$(".platform").each(function() {
						if (overlaps($(this), new_coin)) {
						new_coin.css("top", "0px");
							new_coin.remove();
						}
					});
					new_coin.show();
				}
				else {
				new_coin.css("top", "0px");
					new_coin.remove();
				}
			}
			
			// Coin Animation
			
			$('.coin').css( 'top', '+='+game_speed+'px' );
			
			$('.coin').each(function() {
				if ( overlaps($("#player"), $(this)) ) {
					var coin_val = $(this).attr("data-coin-value");
					if( parseInt(coin_val,10) == 50 ) {
						$.playSound('Sounds/collect_gold_coin');
					}
					else {
						$.playSound('Sounds/collect_silver_coin');
					}
					$(this).remove();
					playerScore += parseInt(coin_val,10);
					$("#score").html("Score: " + playerScore);
					setSpeed();
				}
				else {
					coinObj = $(this);
					$('.bullets').each(function() {
						if( overlaps($(this), coinObj) ) {
							var coin_val = coinObj.attr("data-coin-value");
							if( parseInt(coin_val,10) == 50 ) {
								$.playSound('Sounds/collect_gold_coin');
							}
							else {
								$.playSound('Sounds/collect_silver_coin');
							}
							coinObj.remove();
							playerScore += parseInt(coin_val,10);
							$("#score").html("Score: " + playerScore);
							setSpeed();
						}
					});
				}
			});
				
			
			// Player moving right animation
			if( player.moving_right ) {
				player.facing = 1;
				
				collide = collisionXRight(player.x_pos+player.width, player.x_pos+player.width+player.walk_game_speed+player.dash_move, player.y_pos, player.y_pos+player.height, levelPlatforms);
				if( collide > -1 ) {
					if( difficulty == 1 ) player.moving_right = false;
					player.x_pos = levelPlatforms[collide].x_min-player.width;
				}
				else {
					player.x_pos += player.walk_game_speed+player.dash_move;
				}
				$('#player').css('left', (player.x_pos).toString());
				
				if( !player.jumping && !player.moving_left && collisionWalkOffPlatformRight(player.x_pos, levelPlatforms[player.platform_standing_on]) ) {
					player.falling = true;
				}
				
				if( player.dash_move != 0 ) {
					$('#container').append('<div id="dash_flame" style="position: absolute; left: '+(player.x_pos-player.flame_width).toString()+'; top: '+(player.y_pos).toString()+' "><img src="Textures/dash_right_flame_long.png" /></div>');
					player.dash_move = 0;
					player.flame_animation_counter = 0;
					player.flame_animation_dir = 1;
				}
				
			}
			
			// Player moving left animation
			if( player.moving_left ) {
				player.facing = 0;
			
				collide = collisionXLeft(player.x_pos, player.x_pos-player.walk_game_speed-player.dash_move, player.y_pos, player.y_pos+player.height, levelPlatforms);
				if( collide > -1 ) {
					if( difficulty == 1 ) player.moving_left = false;
					player.x_pos = levelPlatforms[collide].x_max;
				}
				else {
					player.x_pos -= player.walk_game_speed+player.dash_move;
				}
				$('#player').css('left', (player.x_pos).toString());
				
				if( !player.jumping && !player.moving_right && collisionWalkOffPlatformLeft(player.x_pos+player.width, levelPlatforms[player.platform_standing_on]) ) {
					player.falling = true;
				}
				
				if( player.dash_move != 0 ) {
					$('#container').append('<div id="dash_flame" style="position: absolute; left: '+(player.x_pos+player.width).toString()+'; top: '+(player.y_pos).toString()+' "><img src="Textures/dash_left_flame_long.png" /></div>');
					player.dash_move = 0;
					player.flame_animation_counter = 0;
					player.flame_animation_dir = 0;
				}
			}

			// Player jumping animation
			if( player.jumping ) {
				if( player.current_jump_game_speed > player.terminal_velocity ) {
					player.current_jump_game_speed -= player.gravity;
				}
				
				collideUp = collisionYUp(player.x_pos, player.x_pos+player.width, player.y_pos, player.y_pos-player.current_jump_game_speed-player.dash_up, levelPlatforms);
				if( collideUp > -1 ) {	// Player hit the bottom of a platform, so stop jumping and begin falling animation
					player.current_jump_game_speed = 0;
					player.y_pos = levelPlatforms[collideUp].y_max;
					player.jumping = false;
					player.falling = true;
				}		
				else {
					collideDown = collisionYDown(player.x_pos, player.x_pos+player.width, player.y_pos+player.height, player.y_pos+player.height-player.current_jump_game_speed-player.dash_up, levelPlatforms);
					if( collideDown > -1 ) {
						player.jumping = false;
						player.y_pos = levelPlatforms[collideDown].y_min-player.height;
						player.platform_standing_on = collideDown;
						player.current_jump_game_speed = 0;
						if( player.platform_standing_on == 0 ) {
							$.playSound('Sounds/lose');
							prev_game_state = current_game_state;
							current_game_state = gameStates.CreateLoseLevel;
						}
					}
					else {
						player.y_pos -= player.current_jump_game_speed+player.dash_up;
					}
				}
				$('#player').css('top',(player.y_pos).toString());
				
				if( player.dash_up != 0 ) {
					$('#container').append('<div id="dash_flame" style="position: absolute; left: '+(player.x_pos).toString()+'; top: '+(player.y_pos+player.height).toString()+'; "><img src="Textures/dash_up_flame_long.png" /></div>');
					player.dash_up = 0;
					player.flame_animation_counter = 0;
					player.flame_animation_dir = 2;
				}
			}
			
			// Player falling animation
			if( player.falling ) {
				if( player.current_jump_game_speed > player.terminal_velocity ) {
					player.current_jump_game_speed -= player.gravity;
				}
				collide = collisionYDown(player.x_pos, player.x_pos+player.width, player.y_pos+player.height, player.y_pos+player.height-player.current_jump_game_speed, levelPlatforms);
				if( collide > -1 ) {
					player.falling = false;
					player.y_pos = levelPlatforms[collide].y_min-player.height;
					player.platform_standing_on = collide;
					player.current_jump_game_speed = 0;
					if( player.platform_standing_on == 0 ) {
						$.playSound('Sounds/lose');
						prev_game_state = current_game_state;
						current_game_state = gameStates.CreateLoseLevel;
					}
				}
				else {
					player.y_pos -= player.current_jump_game_speed;
				}
				$('#player').css('top',(player.y_pos).toString());
			}
			
			// Dash Flame Animation
			if( player.flame_animation_counter > -1 && player.flame_animation_counter > player.flame_animation_time ) {
				$('#dash_flame').remove();
				player.flame_animation_counter = -1;
				player.flame_animation_dir = -1;
			}
			else if( player.flame_animation_counter > -1 ) {
				player.flame_animation_counter++;
				if( player.flame_animation_dir == 2 ) $('#dash_flame').css('left', (player.x_pos).toString());
				if( player.flame_animation_dir == 1 ) $('#dash_flame').css('left', (player.x_pos-player.flame_width).toString());
				else if( player.flame_animation_dir == 0 ) $('#dash_flame').css('left', (player.x_pos+player.width).toString());
				if( player.flame_animation_dir == 2 ) $('#dash_flame').css('top', (player.y_pos+player.height).toString());
				else $('#dash_flame').css('top', (player.y_pos).toString());
				$('#dash_flame').css('opacity', ((100.0 - (100.0/player.flame_animation_time)*player.flame_animation_counter)/100.0).toString());
			}
			
			// Bullet Animations
			for( var i = 0; i < bullets.length; ++i ) {
				if( bullets[i].exists ) {
					if( bullets[i].dir == 1 ) {
					
						if( bullets[i].x_pos > right_boundary ) {
							$('#bullets_'+(bullets[i].id).toString()).remove();
							bullets.splice(i,1);
							continue;
						}
					
						bullets[i].x_pos += bullet_game_speed;
						bullets[i].y_pos += game_speed;
					}
					else {
					
						if( bullets[i].x_pos+10 < left_boundary ) {
							$('#bullets_'+(bullets[i].id).toString()).remove();
							bullets.splice(i,1);
							continue;
						}
						
						bullets[i].x_pos -= bullet_game_speed;
						bullets[i].y_pos += game_speed;
					}
					$('#bullets_'+(bullets[i].id).toString()).css('left', (bullets[i].x_pos).toString());
					$('#bullets_'+(bullets[i].id).toString()).css('top', (bullets[i].y_pos).toString());
				}
				else {
					$('#container').append('<div class="bullets" id="bullets_'+(bullets[i].id).toString()+'" style="position: absolute; width: '+bullet_width.toString()+'px; height: '+bullet_height.toString()+'px; background-color: #000; left: '+(bullets[i].x_pos).toString()+'; top: '+(bullets[i].y_pos).toString()+';"></div>');
					bullets[i].exists = true;
				}
			}
			
			if (bullet_delay_counter > bullet_delay) {
				bullet_delay_flag = true;
				bullet_delay_counter = 0;
			}
			else {
				++bullet_delay_counter;
			}
			
			// Reset the bullet_id control variable to 0 if there are no active bullets
			if( bullets.length == 0 ) {
				bullet_id = 0;
			}
			
			
			// Gem Animation
			
			$('.gem').css( 'top', '+='+game_speed+'px' );
			
			// Gem Collision


			$('.gem').each(function() {
				gemObj = $(this);
				$('.bullets').each(function() {
					if( overlaps($(this), gemObj) ) {
						if( gemObj.attr('data-gem') == sequence[sequencePtr].toString() ) {
							$.playSound('Sounds/lose');
							prev_game_state = current_game_state;
							current_game_state = gameStates.CreateLoseLevel;
							sequencePtr = 0;
							return;
						}
						$.playSound('Sounds/explosion');
						explosionAnim = true;
						$('#explosionAnim').css('top', (gemObj.position().top-32).toString());
						$('#explosionAnim').css('left', (gemObj.position().left-32).toString());
						$('#explosionAnim').css('z-index', 10);
						gemObj.remove();
					}
				});
				if ( overlaps($("#player"), $(this)) ) {
					gemID = $(this).attr('data-gem');
					if( gemID != sequence[sequencePtr].toString() ) {
						$.playSound('Sounds/lose');
						prev_game_state = current_game_state;
						current_game_state = gameStates.CreateLoseLevel;
						sequencePtr = 0;
					}
					else {
						playerScore += 40;
						$("#score").html("Score: " + playerScore);
						setSpeed();
						
						$.playSound('Sounds/collect_gem');
						sparkleAnim = true;
						$('#sparkleAnim').css('top', ($(this).position().top-25/2).toString());
						$('#sparkleAnim').css('left', ($(this).position().left-25/2).toString());
						$('#sparkleAnim').css('z-index', 10);
						$(this).remove();
						if( sequencePtr >= 2 ) {
							sequencePtr = 0;
						}
						else {
							sequencePtr++;
						}
					}
				}
			});
			
			
			// Platform Animation
			for (var i = 0; i < allPlatforms.length; ++i) {
				allPlatforms[i][1] = (parseInt(allPlatforms[i][1],10)-game_speed).toString();		
				if (bottom_boundary-parseInt(allPlatforms[i][1],10)+parseInt(allPlatforms[i][3],10) >= top_boundary) {
					//add
					createPlatform(parseInt(allPlatforms[i][0],10), parseInt(allPlatforms[i][1],10), parseInt(allPlatforms[i][2],10), parseInt(allPlatforms[i][3],10));
					allPlatforms.splice(i, 1);
					--i;
				}				
			}
			
			
			for( var i = 4; i < levelPlatforms.length; ++i ) {
				levelPlatforms[i].y_min += game_speed;
				levelPlatforms[i].y_max += game_speed;

				if (levelPlatforms[i].y_min > bottom_boundary) {
				 //remove platform
					$('#platform_'+(levelPlatforms[i].id).toString()).remove();
					levelPlatforms.splice(i, 1);
					if( !player.jumping && !player.falling && i < player.platform_standing_on ) {
						--player.platform_standing_on;
					}
				}
				else {
					$('#platform_'+(levelPlatforms[i].id).toString()).css('top', (levelPlatforms[i].y_min).toString());
					if (!player.jumping && !player.falling && player.platform_standing_on == i) {
						player.y_pos += game_speed;
						$('#player').css('top', (player.y_pos).toString());
						
						if( player.y_pos+player.height == bottom_boundary ) {
							$.playSound('Sounds/lose');
							prev_game_state = current_game_state;
							current_game_state = gameStates.CreateLoseLevel;
						}
					}
				}
			}
			
			// Lava Animation
			if( lava1_dir == 1 ) {
				if( lava1_x_pos >= 0 ) {
					lava1_dir = 0;
				}
				else {
					lava1_x_pos += 3;
				}
			}
			else {
				if( lava1_x_pos <= -15 ) {
					lava1_dir = 1;
				}
				else {
					lava1_x_pos -= 2;
				}
			}
			if( lava2_dir == 0 ) {
				if( lava2_x_pos <= -15 ) {
					lava2_dir = 1;
				}
				else {
					lava2_x_pos -= 2;
				}
			}
			else {
				if( lava2_x_pos >= 0 ) {
					lava2_dir = 0;
				}
				else {
					lava2_x_pos++;
				}
			}
			$('#lava1').css('left', lava1_x_pos.toString());
			$('#lava2').css('left', lava2_x_pos.toString());
			
			
			if( sparkleAnim ) {
				$('#sparkleAnim').children().css('opacity','1.0');
				if( sparkleAnimIndex > 8 ) {
					sparkleAnim = false;
					sparkleAnimIndex = 1;
					$('#sparkleAnim').children().animate({
										opacity: 0.0,
										}, 400, function() {
					});
				}
				else {
					$('#sparkleAnim').children().attr('src','Textures/SparkleAnimation/frame'+sparkleAnimIndex.toString()+'.png');
					sparkleAnimIndex++;
				}
			}
			
			explosion_xcoor = 0;
			explosion_ycoor = 0;
			if( explosionAnim ) {
				$('#explosionAnim').css('opacity','1.0');
				if( explosionAnimIndex > 48 ) {
					destroyExplosion();
				}
				else {
					explosion_xcoor = ((explosionAnimIndex-1)%8)*64;
					if( explosionAnimIndex-8 > 1 && explosionAnimIndex-8 < 8 ) explosion_ycoor = 1;
					else if( explosionAnimIndex-16 > 1 && explosionAnimIndex-16 < 8 ) explosion_ycoor = 2;
					else if( explosionAnimIndex-24 > 1 && explosionAnimIndex-24 < 8 ) explosion_ycoor = 3;
					else if( explosionAnimIndex-32 > 1 && explosionAnimIndex-32 < 8 ) explosion_ycoor = 4;
					else if( explosionAnimIndex-40 > 1 && explosionAnimIndex-40 < 8 ) explosion_ycoor = 5;
					else explosion_ycoor = 0;
					explosion_ycoor *= 64;
					
					$('#explosionAnim').css('background','url("Textures/ExplosionAnimation/explosion.png") '+explosion_xcoor.toString()+' '+explosion_ycoor.toString());
					$('#explosionAnim').css('top', '+='+game_speed.toString());
					explosionAnimIndex++;
				}
			}
			
			break;
		case gameStates.CreateWinLevel:
			destroyPlayLevelButtons();
			destroyLevel();
			createWinLevelButtons();
			prev_game_state = current_game_state;
			current_game_state = gameStates.WinLevelWait;
			break;
		case gameStates.WinLevelWait:
			break;
		case gameStates.CreateLoseLevel:
			destroyPlayLevelButtons();
			destroyLevel();
			createLoseLevelButtons();
			prev_game_state = current_game_state;
			current_game_state = gameStates.LoseLevelWait;
			break;
		case gameStates.LoseLevelWait:
			break;
		default:
			current_game_state = gameStates.MainMenu;
			break;
	}
	
}

dash_button_release = true;

option_selected = -1;

// Input handler for keyboard presses
$(document).on('keydown', function(event) {
	
	//alert(event.which);
	
	switch(current_game_state) {
		case gameStates.CreateMainMenu:
			break;
		case gameStates.MainMenuWait:
			switch(event.which) {
				case 87:
					$('#play_button').toggleClass('highlight_option',true);
					$('#options_button').toggleClass('highlight_option',false);
					break;
				case 83:
					$('#play_button').toggleClass('highlight_option',false);
					$('#options_button').toggleClass('highlight_option',true);
					break;
				case 32:
					$('.highlight_option').trigger('click');
					break;
				default:
					break;
			}
			break;
		case gameStates.BackToMainMenu:
			break;
		case gameStates.OptionsMenuWait:
			switch(event.which) {
				case 87:
					if( option_selected == -1 ) {
						option_selected = 0;
					}
					else if( option_selected != 4 ) {
						if( option_selected == 0 ) {
							option_selected = 3;
						}
						else {
							--option_selected;
						}
					}
					break;
				case 83:
					if( option_selected == -1 ) {
						option_selected = 0;
					}
					else if( option_selected != 4 ) {
						if( option_selected == 3 ) {
							option_selected = 0;
						}
						else {
							++option_selected;
						}
					}
					break;
				case 32:
					switch(option_selected) {
						case 0:
							$('#shoot_option_mouse').trigger('click');
							break;
						case 1:
							$('#shoot_option_facing').trigger('click');
							break;
						case 2:
							$('#difficulty_option_easy').trigger('click');
							break;
						case 3:
							$('#difficulty_option_hard').trigger('click');
							break;
						case 4:
							option_selected = -1;
							$('#main_menu_button').trigger('click');
							break;
						default:
							break;
					}
					break;
				case 68:
					option_selected = 4;
					break;
				case 65:
					option_selected = 0;
				default:
					break;
			}
			switch(option_selected) {
				case 0:
					$('#shoot_option_mouse').toggleClass('highlight_option',true);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 1:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',true);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 2:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',true);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 3:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',true);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 4:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',true);
					break;
				default:
					break;
			}
			break;
		case gameStates.LoadLevel:
			break;
		case gameStates.ReloadLevel:
			break;
		case gameStates.PlayLevel:
			switch(event.which) {
				case 68:
					player.moveRight();
					break;
				case 65:
					player.moveLeft();
					break;
				case 16:
					if( dash_button_release && player.flame_animation_counter == -1 ) {
						player.dash();
						dash_button_release = false;
					}
					break;
				case 32:
					player.jump();
					break;
				case 13:
					explosionAnim = true;
					break;
				default:
					break;
			}
			break;
		case gameStates.WinLevelWait:
			break;
		case gameStates.LoseLevelWait:
			switch(event.which) {
				case 65:
					$('#restart_button').toggleClass('highlight_option', true);
					$('#main_menu_button').toggleClass('highlight_option', false);
					break;
				case 68:
					$('#restart_button').toggleClass('highlight_option', false);
					$('#main_menu_button').toggleClass('highlight_option', true);
					break;
				case 32:
					$('.highlight_option').trigger('click');
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}
	
});

// Input handler for letting go of keyboard keys
$(document).on('keyup', function(event) {
	
	switch(current_game_state) {
		case gameStates.CreateMainMenu:
			break;
		case gameStates.MainMenuWait:
			break;
		case gameStates.BackToMainMenu:
			break;
		case gameStates.LoadLevel:
			break;
		case gameStates.ReloadLevel:
			break;
		case gameStates.PlayLevel:
			switch(event.which) {
				case 68:
					player.stopMoveRight();
					break;
				case 65:
					player.stopMoveLeft();
					break;
				case 16:
					dash_button_release = true;
					break;
				default:
					break;
			}
			break;
		case gameStates.WinLevel:
			break;
		case gameStates.LoseLevel:
			break;
		default:
			break;
	}
	
});

// Input handler for mouse down events
$(document).on('mousedown', function(event) {
	
	switch(current_game_state) {
		case gameStates.CreateMainMenu:
			break;
		case gameStates.MainMenuWait:
			break;
		case gameStates.BackToMainMenu:
			break;
		case gameStates.LoadLevel:
			break;
		case gameStates.ReloadLevel:
			break;
		case gameStates.PlayLevel:
			switch(event.which) {
				case 1:
					player.shoot(event.clientX);
					break;
				default:
					break;
			}
			break;
		case gameStates.WinLevel:
			break;
		case gameStates.LoseLevel:
			break;
		default:
			break;
	}
	
});

function setSpeed() {
	switch(playerScore) {
		case 240:
			if( difficulty == 0 ) game_speed = 2;
			else game_speed = 4;
			break;
		case 480:
			if( difficulty == 0 ) game_speed = 3;
			else game_speed = 5;
			break;
		case 720:
			if( difficulty == 0 ) game_speed = 4;
			else game_speed = 6;
			break;
		case 960:
			if( difficulty == 0 ) game_speed = 5;
			else game_speed = 7;
			break;
	}
}


var option_release = true;
var gamepads = [];

var buttons_pressed = new Array(16);

function checkXBoxInput() {

	var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGetGamepads;
	if( gamepadSupportAvailable ) {
		gamepads = [];
		var raw_gamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;
		
		for( var i = 0; i < raw_gamepads.length; ++i ) {
			if (raw_gamepads[i]) {
				gamepads.push(raw_gamepads[i]);
			}
		}
		
		for( var i = 0; i < buttons_pressed.length; ++i )
			buttons_pressed[i] = false;
			
		for ( var i = 0; i < gamepads.length; ++i ) {
			for ( var j = 0; j < (gamepads[i].buttons).length; ++j ) {
				if( gamepads[i].buttons[j] ) buttons_pressed[j] = true;
			}
			if( gamepads[i].axes[0] < -0.5 ) buttons_pressed[14] = true;
			if( gamepads[i].axes[0] > 0.5 ) buttons_pressed[15] = true;
			if( gamepads[i].axes[1] < -0.5 ) buttons_pressed[12] = true;
			if( gamepads[i].axes[1] > 0.5 ) buttons_pressed[13] = true;
		}
	}
	
	switch(current_game_state) {
		case gameStates.CreateMainMenu:
			break;
		case gameStates.MainMenuWait:
			if( buttons_pressed[12] ) {
				$('#play_button').toggleClass('highlight_option',true);
				$('#options_button').toggleClass('highlight_option',false);
			}
			if( buttons_pressed[13] ) {
				$('#play_button').toggleClass('highlight_option',false);
				$('#options_button').toggleClass('highlight_option',true);
			}
			if( buttons_pressed[0] && option_release ) {
				if( !xBoxControllerActive ) {
					xBoxControllerActive = true;
					$('#xbox_hint').remove();
					$('#play_button').toggleClass('highlight_option',true);
					$('#options_button').toggleClass('highlight_option',false);
					option_release = false;
				}
				else {
					$('.highlight_option').trigger('click');
				}
			}
			if( !buttons_pressed[0] ) {
				option_release = true;
			}
			break;
		case gameStates.BackToMainMenu:
			break;
		case gameStates.OptionsMenuWait:
			if( buttons_pressed[12] && option_release ) {
				option_release = false;
				if( option_selected == -1 ) {
					option_selected = 0;
				}
				else if( option_selected != 4 ) {
					if( option_selected == 0 ) {
						option_selected = 3;
					}
					else {
						--option_selected;
					}
				}
			}
			if( buttons_pressed[13] && option_release ) {
				option_release = false;
				if( option_selected == -1 ) {
					option_selected = 0;
				}
				else if( option_selected != 4 ) {
					if( option_selected == 3 ) {
						option_selected = 0;
					}
					else {
						++option_selected;
					}
				}
			}
			if( buttons_pressed[0] && option_release ) {
				option_release = false;
				switch(option_selected) {
					case 0:
						$('#shoot_option_mouse').trigger('click');
						break;
					case 1:
						$('#shoot_option_facing').trigger('click');
						break;
					case 2:
						$('#difficulty_option_easy').trigger('click');
						break;
					case 3:
						$('#difficulty_option_hard').trigger('click');
						break;
					case 4:
						option_selected = -1;
						$('#main_menu_button').trigger('click');
						break;
					default:
						break;
				}
			}
			if( buttons_pressed[15] && option_release ) {
				option_release = false;
				option_selected = 4;
			}
			if( buttons_pressed[14] && option_release ) {
				option_release = false;
				option_selected = 0;
			}
			if( !buttons_pressed[12] && !buttons_pressed[13] && !buttons_pressed[14] && !buttons_pressed[15] && !buttons_pressed[0] ) {
				option_release = true;
			}
			switch(option_selected) {
				case 0:
					$('#shoot_option_mouse').toggleClass('highlight_option',true);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 1:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',true);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 2:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',true);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 3:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',true);
					$('#main_menu_button').toggleClass('highlight_option',false);
					break;
				case 4:
					$('#shoot_option_mouse').toggleClass('highlight_option',false);
					$('#shoot_option_facing').toggleClass('highlight_option',false);
					$('#difficulty_option_easy').toggleClass('highlight_option',false);
					$('#difficulty_option_hard').toggleClass('highlight_option',false);
					$('#main_menu_button').toggleClass('highlight_option',true);
					break;
				default:
					break;
			}
			break;
		case gameStates.LoadLevel:
			break;
		case gameStates.ReloadLevel:
			break;
		case gameStates.PlayLevel:
			if( buttons_pressed[15] ) {
				player.moveRight();
			}
			else {
				player.stopMoveRight();
			}
			if( buttons_pressed[14] ) {
				player.moveLeft();
			}
			else {
				player.stopMoveLeft();
			}
			if( buttons_pressed[7] ) {
				if( dash_button_release && player.flame_animation_counter == -1 ) {
					player.dash();
					dash_button_release = false;
				}
			}
			else {
				dash_button_release = true;
			}
			if( buttons_pressed[0] ) {
				player.jump();
			}
			if( buttons_pressed[2] ) {
				player.shoot(-1);
			}
			break;
		case gameStates.WinLevelWait:
			break;
		case gameStates.LoseLevelWait:
			if( buttons_pressed[14] ) {
				$('#restart_button').toggleClass('highlight_option', true);
				$('#main_menu_button').toggleClass('highlight_option', false);
			}
			if( buttons_pressed[15] ) {
				$('#restart_button').toggleClass('highlight_option', false);
				$('#main_menu_button').toggleClass('highlight_option', true);
			}
			if( buttons_pressed[0] ) {
				$('.highlight_option').trigger('click');
			}
			break;
		default:
			break;
	}

}







var overlaps = (function () {
    function getPositions( elem ) {
        var pos, width, height;
        pos = $( elem ).position();
        width = $( elem ).width();
        height = $( elem ).height();
        return [ [ pos.left, pos.left + width ], [ pos.top, pos.top + height ] ];
    }

    function comparePositions( p1, p2 ) {
        var r1, r2;
        r1 = p1[0] < p2[0] ? p1 : p2;
        r2 = p1[0] < p2[0] ? p2 : p1;
        return r1[1] > r2[0] || r1[0] === r2[0];
    }

    return function ( a, b ) {
        var pos1 = getPositions( a ),
            pos2 = getPositions( b );
        return comparePositions( pos1[0], pos2[0] ) && comparePositions( pos1[1], pos2[1] );
    };
})();


});