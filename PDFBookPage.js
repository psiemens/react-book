import React from 'react';

const renderEvent = new Event('page-render');

export default class PDFBookPage extends React.Component {
  constructor(props) {
    super(props);

    this.showRenderedPage = this.showRenderedPage.bind(this)
    this.canvasRef = React.createRef();

    this.state = {
      height: 0,
      width: 0,
      isRendered: false,
    }
  }

  componentDidMount() {
    this.canvasRef.current.addEventListener('page-render', this.showRenderedPage);

    const viewport = this.props.page.getViewport(this.props.scale);
    this.setState({
      height: viewport.height,
      width: viewport.width,
    });

    var renderContext = {
      canvasContext: this.canvasRef.current.getContext('2d'),
      viewport: viewport
    };

    this.props.page.render(renderContext)
      .then(() => {
        if (this.canvasRef.current) {
          this.canvasRef.current.dispatchEvent(renderEvent)
        }
      });
  }

  componentWillUnmount() {
    this.canvasRef.current.removeEventListener('page-render', this.showRenderedPage);
  }

  showRenderedPage() {
    this.setState({ isRendered: true })
  }

  render() {
    let canvasStyle = {}

    if (this.props.page.pageIndex == 0) {
      canvasStyle.opacity = this.state.isRendered ? 1 : 0;
    }

    return (
      <canvas
        style={canvasStyle}
        ref={this.canvasRef}
        data-page={this.props.page.pageIndex+1}
        height={this.state.height}
        width={this.state.width} />
    )
  }
}
