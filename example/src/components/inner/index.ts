import { JComponent } from 'jgb-weapp';
JComponent({
  data: {
    inner: 'component data'
  },
  ready() {
    this.setData({
      inner: 'component data ' + Math.random()
    });
  },
  methods: {
    onTap() {}
  }
});
