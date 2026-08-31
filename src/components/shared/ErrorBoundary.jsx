import { Component } from 'react'
import { Button, Result } from 'antd'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chunk load or render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="A page failed to load. Please try again."
          extra={
            <Button type="primary" onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
              Reload page
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
