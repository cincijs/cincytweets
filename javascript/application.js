$(function() {
  window.Tweet = Backbone.Model.extend({
    initialize: function(attrs) {
      // add in a few helper attributes
      if (attrs.text) {
        this.set({
          //html: twttr.txt.autoLink(attrs.text),
          //timestamp: Date.parse(attrs.created_at).setTimezone('GMT')
        }, {
          silent: true
        });
      };

      // set a default view for this tweet
      this.view = new TweetView({
        model: this
      });
    },
    url: function() {
      return "http://twitter.com/" + this.get('from_user') + "/statuses/" + this.get('id');
    }
  });

  window.TweetList = Backbone.Collection.extend({
    model: Tweet,
    url: 'http://search.twitter.com/search.json?q=cincinnati&callback=?',
    parse: function(response) {
      return response.results;
    }
  });

  window.Tweets = new TweetList;

  window.TweetView = Backbone.View.extend({
    tagName:  "li",
    template: _.template($('#tweet-template').html()),

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    // Re-render the contents of the tweet item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },

    setContent: function() {
      var content = this.model.get('text');
      this.$('.tweet-content').text(content);
    }
  });

  window.AppView = Backbone.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#tweetapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .tweet": "showTooltip",
    },

    // At initialization we bind to the relevant events on the `Tweets`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting tweets that might be saved in *localStorage*.
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      Tweets.bind('add',     this.addOne);
      Tweets.bind('refresh', this.addAll);
      Tweets.bind('all',     this.render);

      Tweets.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.$('#tweet-stats').html(this.statsTemplate({
        total: Tweets.length,
      }));
    },

    // Add a single tweet item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(tweet) {
      var view = new TweetView({model: tweet});
      this.$("#tweet-list").append(view.render().el);
    },

    // Add all items in the **Tweets** collection at once.
    addAll: function() {
      Tweets.each(this.addOne);
    },

    // Generate the attributes for a new tweet item.
    newAttributes: function() {
      return {
        content: this.input.val(),
        order:   Tweets.nextOrder(),
      };
    },

    // If you hit return in the main input field, create new **tweet** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      Tweets.create(this.newAttributes());
      this.input.val('');
    },

    // Lazily show the tooltip that tells you to press `enter` to save
    // a new tweet item, after one second.
    showTooltip: function(e) {
      var tooltip = this.$(".ui-tooltip-top");
      var val = this.input.val();
      tooltip.fadeOut();
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if (val == '' || val == this.input.attr('placeholder')) return;
      var show = function(){ tooltip.show().fadeIn(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;
});
