if(typeof TROPHY_REGISTER == "undefined"){
	TROPHY_REGISTER = {};
}

TROPHY_REGISTER["pixeldepth_trophies"] = {

	name: "Core Pack",
	description: "Default trophies that come with the plugin",

	plugin_id: "pixeldepth_trophies",
	plugin_key: "pixeldepth_trophies",

	// This is used for local and key data

	trophies_key: "t",

	// This is used for local and key data

	trophies_data_key: "d",

	init: function(pack, events, self){
		self.pack = pack;
		self.events = events;
		self.user_data = trophies.data(yootil.user.id());
		self.pack_data = self.user_data.get.pack_data(pack.plugin_id);
		self.local_pack_data = self.user_data.get.local_pack_data(pack.plugin_id);

		// Only want to run timers if user is on an active tab

		self.capture_tab_visibility();

		// Bind click to the follow button to capture follows

		self.bind_follows();

		// Perform some stuff before keys are synced

		self.bind_sync_event();

	},

	methods: {

		time_tracker_interval: null,
		topic_tracker_timer: null,
		topic_tracker_incremented: false,
		followed: false,

		capture_topics_read: function(){

			// Check location; if reading a topic, increment counter
			// and save to local.

			if(yootil.location.thread()){

				// Timer is cleared if it is open in other tabs

				var self = this;

				this.tropic_tracker_timer = setTimeout(function(){
					if(self.topic_tracker_incremented){
						return;
					}

					// Need to get latest pack data, as this can be updated outside
					// at different times.

					var pack_data = self.user_data.get.pack_data(self.pack.plugin_id);
					var local_pack_data = self.user_data.get.local_pack_data(self.pack.plugin_id);
					var read = (~~ (pack_data.tr))? pack_data.tr : 0;

					if(~~ local_pack_data.tr){
						read = local_pack_data.tr;
					}

					local_pack_data.tr = read + 1;

					// We have tracked a topic in this tab, so mark it

					self.topic_tracker_incremented = true;

					// Finally save, sync, and trigger

					self.user_data.save_local(self.pack.plugin_id, local_pack_data, true);
					$(trophies.events).trigger("trophies.topic_read");
				}, 2000) // 2 seconds, then it will increment the counter
			}
		},

		track_time: function(){

			// Lets not do this if we know the time is never
			// going to be over a certain number?  2 years seems fine.

			var two_years = 63072000;

			if((~~ this.pack_data.tt) > two_years || (~~ this.local_pack_data.tt) > two_years){
				return;
			}

			var self = this;

			this.time_tracker_interval = setInterval(function(){

				// Need to get latest pack data, as this can be updated outside
				// at different times.

				var pack_data = self.user_data.get.pack_data(self.pack.plugin_id);
				var local_pack_data = self.user_data.get.local_pack_data(self.pack.plugin_id);
				var tracked_time = (~~ pack_data.tt)? pack_data.tt : 0;

				if(~~ local_pack_data.tt){
					tracked_time = local_pack_data.tt;
				}

				local_pack_data.tt = tracked_time + 10;
				self.user_data.save_local(self.pack.plugin_id, local_pack_data, true);
			}, 10000); // Increase time tracked every 10 seconds

		},

		bind_sync_event: function(){
			var self = this;

			$(this.events).on("trophies.before_syncing", function(evt, user_data, hook){
				var pack_data = self.user_data.get.pack_data(self.pack.plugin_id);
				var local_pack_data = self.user_data.get.local_pack_data(self.pack.plugin_id);

				if(yootil.location.posting_thread()){

					// Topics posted

					if(!pack_data.tp){
						pack_data.tp = 0;
					}

					pack_data.tp ++;
				}

				// Tracked time

				if(local_pack_data.tt){
					pack_data.tt = local_pack_data.tt;
					local_pack_data.tt = 0;
				}

				// Handle topics read

				if(local_pack_data.tr){
					pack_data.tr = local_pack_data.tr;
					local_pack_data.tr = 0;
				}

				// Handle topics read

				if(local_pack_data.mf){
					pack_data.mf = local_pack_data.mf;
					local_pack_data.mf = 0;
				}

				self.user_data.set.pack_data(self.pack.plugin_id, pack_data);
			});
		},

		// Could have used the visibility API but it didn't
		// work too well on tabs opened in the background.

		capture_tab_visibility: function(){
			var self = this;

			$([window, document]).blur(function(){

				// Time tracker

				clearInterval(self.time_tracker_interval);
				self.time_tracker_interval = null;

				// Topics created tracker

				clearTimeout(self.topic_tracker_timer);
				self.topic_tracker_timer = null;
			}).focus(function(){

				// Time tracker

				if(!self.time_tracker_interval){
					self.track_time();
				}

				// Topic tracker

				if(!self.topic_tracker_timer && !self.topic_tracker_incremented){
					self.capture_topics_read();
				}
			});
		},

		/**
		 * Monitors the "Follow" button on profiles.
		 */

		bind_follows: function(){
			if(yootil.location.profile()){
				var self = this;
				var button = $(".button.follow_button");

				if(button.length == 1){
					button.on("click", function(){
						if($(this).text() == "Follow" && !self.followed){
							self.followed = true;

							var pack_data = self.user_data.get.pack_data(self.pack.plugin_id);
							var local_pack_data = self.user_data.get.local_pack_data(self.pack.plugin_id);
							var follows = (~~ (pack_data.mf))? pack_data.mf : 0;

							if(~~ local_pack_data.mf){
								follows = local_pack_data.mf;
							}

							local_pack_data.mf = follows + 1;

							self.user_data.save_local(self.pack.plugin_id, local_pack_data, true);

							// Trigger event so trophy pops

							$(trophies.events).trigger("trophies.followed");
						}
					})
				}
			}
		}

	},

	"trophies": [

		{

			id: 1,
			cup: "bronze",
			title: "Welcome",
			image: "logged_in",
			description: "Logged in to your account",
			disabled: false,
			callback: function(trophy){
				this.show_notification(trophy);
			}

		},

		{

			id: 2,
			cup: "bronze",
			title: "First Post",
			image: "post_1",
			description: "Created 1 post",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 1){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 3,
			cup: "bronze",
			title: "10 Posts",
			image: "post_10",
			description: "Created 10 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 10){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 4,
			cup: "bronze",
			title: "25 Posts",
			image: "post_25",
			description: "Created 25 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 25){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 5,
			cup: "bronze",
			title: "50 Posts",
			image: "post_50",
			description: "Created 50 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 50){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 6,
			cup: "bronze",
			title: "Forum Century",
			image: "post_100",
			description: "Created 100 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 100){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 7,
			cup: "silver",
			title: "Posting Maniac",
			image: "post_250",
			description: "Created 250 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 250){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 8,
			cup: "silver",
			title: "Tree Fiddy",
			image: "post_350",
			description: "Created 350 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 350){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 9,
			cup: "silver",
			title: "500 Club",
			image: "post_500",
			description: "Created 500 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 500){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 10,
			cup: "gold",
			title: "Part of the Community",
			image: "post_1000",
			description: "Created 1,000 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 1000){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 11,
			cup: "gold",
			title: "Forum Spammer",
			image: "post_5000",
			description: "Created 5,000 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() >= 5000){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 12,
			cup: "gold",
			title: "Over 9000",
			image: "post_9001",
			description: "Created over 9,000 posts",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				if(yootil.user.posts() > 9000){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 13,
			cup: "bronze",
			title: "Nosey",
			image: "view_profile",
			description: "Viewed another members profile",
			disabled: false,
			callback: function(trophy){
				if(yootil.location.check.profile() && yootil.user.id() != yootil.page.member.id()){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 14,
			cup: "bronze",
			title: "First Topic",
			image: "topic_1",
			description: "Created 1 topic",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				var data = trophies.data(yootil.user.id()).get.pack_data(trophy.pack);
				var current_topics = data.tp || 0;

				if(current_topics >= 1){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 15,
			cup: "bronze",
			title: "5 Topics",
			image: "topic_5",
			description: "Created 5 topics",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				var data = trophies.data(yootil.user.id()).get.pack_data(trophy.pack);
				var current_topics = data.tp || 0;

				if(current_topics >= 5){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 16,
			cup: "silver",
			title: "15 Topics",
			image: "topic_15",
			description: "Created 15 topics",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				var data = this.data(yootil.user.id()).get.pack_data(trophy.pack);
				var current_topics = data.tp || 0;

				if(current_topics >= 15){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 17,
			cup: "gold",
			title: "30 Topics",
			image: "topic_30",
			description: "Created 30 topics",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				var data = this.data(yootil.user.id()).get.pack_data(trophy.pack);
				var current_topics = data.tp || 0;

				if(current_topics >= 30){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 18,
			cup: "gold",
			title: "Conversation Starter",
			image: "topic_50",
			description: "Created 50 topics",
			sort_on: "description",
			disabled: false,
			callback: function(trophy){
				var data = this.data(yootil.user.id()).get.pack_data(trophy.pack);
				var current_topics = data.tp || 0;

				if(current_topics >= 50){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 19,
			cup: "gold",
			title: "Christmas Eve",
			image: "24th",
			description: "Was here on Christmas Eve",
			disabled: false,
			callback: function(trophy){
				var now = new Date(proboards.dataHash.serverDate);

				if((now.getMonth() + 1) == 12 && now.getDate() == 24){
					this.show_notification(trophy, false, false);
				}
			}

		},

		{

			id: 20,
			cup: "gold",
			title: "Christmas Day",
			image: "25th",
			description: "Was here on Christmas Day",
			disabled: false,
			callback: function(trophy){
				var now = new Date(proboards.dataHash.serverDate);

				if((now.getMonth() + 1) == 12 && now.getDate() == 25){
					this.show_notification(trophy, false, false);
				}
			}

		},

		{

			id: 21,
			cup: "bronze",
			title: "A Quick 5 Minutes",
			image: "time_5mins",
			description: "Been here for at least 5 minutes",
			disabled: false,
			interval: 15000,
			callback: function(trophy){
				var user_data = this.data(yootil.user.id());

				if(user_data.trophy.earned(trophy)){
					this.utils.clear_interval(trophy);
					return;
				}

				var local_pack_data = user_data.get.local_pack_data(trophy.pack);
				var tracked_time = local_pack_data.tt || 0;
				var mins = Math.floor(tracked_time / 60);

				if(mins >= 5){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 22,
			cup: "bronze",
			title: "30 Minutes",
			image: "time_30mins",
			description: "Been here for at least 30 minutes",
			disabled: false,
			interval: 15000,
			callback: function(trophy){
				var user_data = this.data(yootil.user.id());

				if(user_data.trophy.earned(trophy)){
					this.utils.clear_interval(trophy);
					return;
				}

				var local_pack_data = user_data.get.local_pack_data(trophy.pack);
				var tracked_time = local_pack_data.tt || 0;
				var mins = Math.floor(tracked_time / 60);

				if(mins >= 30){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 23,
			cup: "silver",
			title: "60 Minutes",
			image: "time_1hr",
			description: "Been here for at least 1 hour",
			disabled: false,
			interval: 15000,
			callback: function(trophy){
				var user_data = this.data(yootil.user.id());

				if(user_data.trophy.earned(trophy)){
					this.utils.clear_interval(trophy);
					return;
				}

				var local_pack_data = user_data.get.local_pack_data(trophy.pack);
				var tracked_time = local_pack_data.tt || 0;
				var hours = Math.floor(tracked_time / 60 / 60);

				if(hours >= 1){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 24,
			cup: "gold",
			title: "AFK",
			image: "time_12hrs",
			description: "Been here for at least 12 hours",
			disabled: false,
			interval: 15000,
			callback: function(trophy){
				var user_data = this.data(yootil.user.id());

				if(user_data.trophy.earned(trophy)){
					this.utils.clear_interval(trophy);
					return;
				}

				var local_pack_data = user_data.get.local_pack_data(trophy.pack);
				var tracked_time = local_pack_data.tt || 0;
				var hours = Math.floor(tracked_time / 60 / 60);

				if(hours >= 12){
					this.show_notification(trophy);
				}
			}

		},

		{

			id: 25,
			cup: "bronze",
			title: "I Can Read",
			image: "read_1",
			description: "Has read 1 topic",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 1){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 26,
			cup: "bronze",
			title: "5 Read Topics",
			image: "read_5",
			description: "Has read 5 topics",
			disabled: false,
			sort_on: "description",
			timer: 2100,
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 5){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 27,
			cup: "silver",
			title: "Keen Reader",
			image: "read_25",
			description: "Has read 25 topics",
			disabled: false,
			sort_on: "description",
			timer: 2100,
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 25){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 28,
			cup: "gold",
			title: "Big Reader",
			image: "read_50",
			description: "Has read 50 topics",
			disabled: false,
			sort_on: "description",
			timer: 2100,
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 50){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 29,
			cup: "gold",
			title: "Topic Lover",
			image: "read_100",
			description: "Has read 100 topics",
			disabled: false,
			sort_on: "description",
			timer: 2100,
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 100){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 30,
			cup: "gold",
			title: "Reader Extraordinaire",
			image: "read_200",
			description: "Has read 200 topics",
			disabled: false,
			sort_on: "description",
			timer: 2100,
			callback: function(trophy){
				$(this.events).on("trophies.topic_read", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var topics_read = local_pack_data.tr || 0;

					if(topics_read >= 200){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 31,
			cup: "bronze",
			title: "Say Hello To My Little Friend",
			image: "friend_1",
			description: "Followed 1 member",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.followed", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var total_followed = local_pack_data.mf || 0;

					if(total_followed >= 1){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 32,
			cup: "bronze",
			title: "Party For 5",
			image: "friend_5",
			description: "Followed 5 members",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.followed", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var total_followed = local_pack_data.mf || 0;

					if(total_followed >= 5){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 33,
			cup: "silver",
			title: "How Many Friends Do You need?",
			image: "friend_15",
			description: "Followed 15 members",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.followed", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var total_followed = local_pack_data.mf || 0;

					if(total_followed >= 15){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 34,
			cup: "silver",
			title: "Path To Stalking",
			image: "friend_30",
			description: "Followed 30 members",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.followed", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var total_followed = local_pack_data.mf || 0;

					if(total_followed >= 30){
						this.show_notification(evt.data);
					}
				}, this));
			}

		},

		{

			id: 35,
			cup: "gold",
			title: "Stalker",
			image: "friend_50",
			description: "Followed 50 members",
			disabled: false,
			sort_on: "description",
			callback: function(trophy){
				$(this.events).on("trophies.followed", trophy, $.proxy(function(evt){
					var user_data = this.data(yootil.user.id());
					var local_pack_data = user_data.get.local_pack_data(evt.data.pack);
					var total_followed = local_pack_data.mf || 0;

					if(total_followed >= 50){
						this.show_notification(evt.data);
					}
				}, this));
			}

		}

	]

};