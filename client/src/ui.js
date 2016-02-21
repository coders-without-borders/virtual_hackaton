(function($) {
	function UI() {
		const self = this;

		// Bind factory method.
		var factory = self.factory;
		this.factory = function() { return factory.apply(self, arguments); }
	};
	window.UI = UI;

	UI.prototype.center = function(ele) {
		return this;
	}

	UI.prototype.factory = function(name) {
		const ele = $('#ui_' + name);
		if(!ele)
			return null;

		ele.show = function() {
			const win = $(window);
			const left = Math.max(0, ((win.width() - ele.outerWidth()) / 2) + win.scrollLeft()) + "px";
			const top = Math.max(0, ((win.height() - ele.outerHeight()) / 2) + win.scrollTop()) + "px";

			ele.css({
				display: 'block',
				visibility: 'visible',
				position: 'absolute',
				left: left,
				top: top,
				zIndex: 100,
			});
		};

		ele.hide = function() {
			ele.css({
				display: 'none',
				visibility: 'hidden',
				zIndex: 0,
			});
		}

		return ele;
	};

})(jQuery);
