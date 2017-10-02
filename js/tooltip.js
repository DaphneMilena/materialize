(function($, Vel) {
  'use strict';

  let _defaults = {
    exitDelay: 200,
    enterDelay: 0,
    html: null,
    margin: 5,
    inDuration: 300,
    outDuration: 250,
    position: 'bottom',
    transitionMovement: 10
  };


  /**
   * @class
   *
   */
  class Tooltip {
    /**
     * Construct Tooltip instance
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {

      // If exists, destroy and reinitialize
      if (!!el.M_Tooltip) {
        el.M_Tooltip.destroy();
      }

      this.el = el;
      this.$el = $(el);
      this.el.M_Tooltip = this;
      this.options = $.extend({}, Tooltip.defaults, options);

      this.isOpen = false;
      this.isHovered = false;
      this._appendTooltipEl();
      this._setupEventHandlers();
    }

    static get defaults() {
      return _defaults;
    }

    static init($els, options) {
      let arr = [];
      $els.each(function() {
        arr.push(new Tooltip(this, options));
      });
      return arr;
    }

    /**
     * Get Instance
     */
    getInstance() {
      return this;
    }

    /**
     * Teardown component
     */
    destroy() {
      $(this.tooltipEl).remove();
      this._removeEventHandlers();
      this.$el[0].M_Tooltip = undefined;
    }

    _appendTooltipEl() {
      let tooltipEl = document.createElement('div');
      tooltipEl.classList.add('material-tooltip');
      this.tooltipEl = tooltipEl;

      let tooltipContentEl = document.createElement('div');
      tooltipContentEl.classList.add('tooltip-content');
      tooltipContentEl.innerHTML = this.options.html;
      tooltipEl.appendChild(tooltipContentEl);
      document.body.appendChild(tooltipEl);
    }

    _updateTooltipContent() {
      this.tooltipEl.querySelector('.tooltip-content').innerHTML = this.options.html;
    }

    _setupEventHandlers() {
      this.handleMouseEnterBound = this._handleMouseEnter.bind(this);
      this.handleMouseLeaveBound = this._handleMouseLeave.bind(this);
      this.$el[0].addEventListener('mouseenter', this.handleMouseEnterBound);
      this.$el[0].addEventListener('mouseleave', this.handleMouseLeaveBound);
    }

    _removeEventHandlers() {
      this.$el[0].removeEventListener('mouseenter', this.handleMouseEnterBound);
      this.$el[0].removeEventListener('mouseleave', this.handleMouseLeaveBound);
    }

    open() {
      if (this.isOpen) {
        return;
      }

      this.isOpen = true;
      // Update tooltip content with HTML attribute options
      this.options = $.extend({}, this.options, this._getAttributeOptions());
      this._updateTooltipContent();
      this._setEnterDelayTimeout();
    }

    close() {
      if(!this.isOpen) {
        return;
      }

      this.isOpen = false;
      this._setExitDelayTimeout();
    }

    /**
      * Create timeout which delays when the tooltip closes
      */
    _setExitDelayTimeout() {
      clearTimeout(this._exitDelayTimeout);

      this._exitDelayTimeout = setTimeout(() => {
        if (this.isHovered) {
          return;
        } else {
          this._animateOut();
        }
      }, this.options.exitDelay);
    }

    /**
     * Create timeout which delays when the toast closes
     */
    _setEnterDelayTimeout() {
      clearTimeout(this._enterDelayTimeout);

      this._enterDelayTimeout = setTimeout(() => {
        if (!this.isHovered) {
          return;
        } else {
          this._animateIn();
        }
      }, this.options.enterDelay);
    }

    _positionTooltip() {
      let origin = this.$el[0],
          tooltip = this.tooltipEl,
          originHeight = origin.offsetHeight,
          originWidth = origin.offsetWidth,
          tooltipHeight = tooltip.offsetHeight,
          tooltipWidth = tooltip.offsetWidth,
          newCoordinates,
          margin = this.options.margin,
          targetTop,
          targetLeft;

      this.xMovement = 0,
      this.yMovement = 0;

      targetTop = origin.offsetTop;
      targetLeft = origin.offsetLeft;

      if (this.options.position === 'top') {
        targetTop += -(tooltipHeight) - margin;
        targetLeft += originWidth/2 - tooltipWidth/2;
        this.yMovement = -(this.options.transitionMovement);

      } else if (this.options.position === 'right') {
        targetTop += originHeight/2 - tooltipHeight/2;
        targetLeft += originWidth + margin;
        this.xMovement = this.options.transitionMovement;

      } else if (this.options.position === 'left') {
        targetTop += originHeight/2 - tooltipHeight/2;
        targetLeft += -(tooltipWidth) - margin;
        this.xMovement = -(this.options.transitionMovement);

      } else {
        targetTop += originHeight + margin;
        targetLeft += originWidth/2 - tooltipWidth/2;
        this.yMovement = this.options.transitionMovement;
      }

      newCoordinates = this._repositionWithinScreen(
        targetLeft, targetTop, tooltipWidth, tooltipHeight);
      $(tooltip).css({
        top: newCoordinates.y + 'px',
        left: newCoordinates.x + 'px'
      });
    }

    _repositionWithinScreen(x, y, width, height) {
      let scrollLeft = Materialize.getDocumentScrollLeft();
      let scrollTop = Materialize.getDocumentScrollTop();
      let newX = x - scrollLeft;
      let newY = y - scrollTop;

      let bounding = {
        left: x,
        top: y,
        width: width,
        height: height
      };

      let offset = this.options.margin + this.options.transitionMovement;
      let edges = Materialize.checkWithinContainer(document.body, bounding, offset);

      if (edges.left) {
        newX = offset;
      } else if (edges.right) {
        newX -= newX + width - window.innerWidth;
      }

      if (edges.top) {
        newY = offset;
      } else if (edges.bottom) {
        newY -= newY + height - window.innerHeight;
      }

      return {x: newX + scrollLeft, y: newY + scrollTop};
    }

    _animateIn() {
      this._positionTooltip();
      this.tooltipEl.style.visibility = 'visible';
      Vel(this.tooltipEl, 'stop');
      Vel(
        this.tooltipEl, {
          opacity: 1,
          translateX: this.xMovement,
          translateY: this.yMovement
        }, {
          duration: this.options.inDuration,
          easing: 'easeOutCubic',
          queue: false
        });
    }

    _animateOut() {
      Vel(this.tooltipEl, 'stop');
      Vel(
        this.tooltipEl, {
          opacity: 0,
          translateX: 0,
          translateY: 0,
        }, {
          duration: this.options.outDuration,
          easing: 'easeOutCubic',
          queue: false
      });
    }

    _handleMouseEnter() {
      this.isHovered = true;
      this.open();
    }

    _handleMouseLeave() {
      this.isHovered = false;
      this.close();
    }

    _getAttributeOptions() {
      let attributeOptions = {};
      let tooltipTextOption = this.$el[0].getAttribute('data-tooltip');
      let positionOption = this.$el[0].getAttribute('data-position');

      if (tooltipTextOption) {
        attributeOptions.html = tooltipTextOption;
      }

      if (positionOption) {
        attributeOptions.position = positionOption;
      }
      return attributeOptions;
    }
  }

  Materialize.Tooltip = Tooltip;

  jQuery.fn.tooltip = function(methodOrOptions) {
    // Call plugin method if valid method name is passed in
    if (Tooltip.prototype[methodOrOptions]) {
      // Getter methods
      if (methodOrOptions.slice(0,3) === 'get') {
        return this.first()[0].M_Tooltip[methodOrOptions]();

      // Void methods
      } else {
        return this.each(function() {
          this.M_Tooltip[methodOrOptions]();
        });
      }

    // Initialize plugin if options or no argument is passed in
    } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
      Tooltip.init(this, arguments[0]);
      return this;

    // Return error if an unrecognized  method name is passed in
    } else {
      jQuery.error(`Method ${methodOrOptions} does not exist on jQuery.tooltip`);
    }
  };

})(cash, Materialize.Vel);
