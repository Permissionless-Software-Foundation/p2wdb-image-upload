/*
  This Card component summarizes an SLP token.
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import Jdenticon from '@chris.troutner/react-jdenticon'
import axios from 'axios'

// Local libraries
import InfoButton from './info-button'
import SendTokenButton from './send-token-button'

class TokenCard extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appData: props.appData,
      token: props.token,
      shouldCheckIcon: true, // Determines if the app should try to lookup the token icon.

      // This function is passed from the parent Token View. It's called to
      // refresh the tokens data from the blockchain, after a successful
      // token send transaction is broadcast.
      refreshTokens: props.refreshTokens
    }

    // console.log('appData: ', props.appData)
  }

  // After the initial token has been loaded, this function tries to figure
  // out if the token has a token icon. If it does, the icon is lazy-loaded.
  async componentDidMount () {
    const token = this.state.token
    let tokenFound = false
    const shouldCheckIcon = this.state.shouldCheckIcon

    // Exit if the token Icon has already been retrieved.
    if (token.icon !== null) return

    // console.log('this.state.appData: ', this.state.appData)

    // If the URL property of the token has an IPFS CID, then it probably
    // follows the PS002 specification for tokens. Download the token icon
    // and replace the Jdenticon automatically-generated icon.
    if (token.url.includes('ipfs://') && shouldCheckIcon) {
      const wallet = this.state.appData.bchWallet

      // Retrieve token data from psf-slp-indexer.
      const tokenData = await wallet.getTokenData(token.tokenId)
      // console.log(`tokenData: ${JSON.stringify(tokenData, null, 2)}`)

      // If the token has mutable data, then try to retrieve it from IPFS.
      if (tokenData.mutableData && tokenData.mutableData.includes('ipfs://')) {
        const cid = tokenData.mutableData.substring(7)
        // console.log('cid')

        // Retrieve the mutable data from Filecoin/IPFS.
        const url = `https://${cid}.ipfs.dweb.link/data.json`
        const result = await axios.get(url)

        const mutableData = result.data
        // console.log(`mutableData: ${JSON.stringify(mutableData, null, 2)}`)

        const tokenIcon = mutableData.tokenIcon

        const newIcon = (
          <Card.Img src={tokenIcon} style={{ width: '100px' }} />
        )

        tokenFound = true

        // Add the JSX for the icon to the token object.
        token.icon = newIcon

        // Update the wallet state with the new token data.
        // const walletState = this.state.appData.bchWalletState
        // console.log('walletState: ', walletState)

        // Replace the auto-generated icon with the one specified in the mutable data.
        this.setState({
          token,
          shouldCheckIcon: false
        })
      }
    }

    // If the token does not have mutable data to store icon data,
    // Check the slp-token-icon GitHub repository for an icon:
    // https://github.com/kosinusbch/slp-token-icons
    if (!tokenFound && shouldCheckIcon) {
      const url = `https://tokens.bch.sx/100/${token.tokenId}.png`
      // console.log('url: ', url)

      // Check to see if icon exists. If it doesn't, axios will throw an error
      // and this function can exit.
      try {
        await axios.get(url)
      } catch (err) {
        // Both types of icon lookup has failed. Mark the token with a Jdenticon
        // to prevent unneeded network calls.

        token.icon = (<Jdenticon size='100' value={this.state.token.tokenId} />)

        this.setState({
          // icon: newIcon,
          token,
          shouldCheckIcon: false
        })

        return
      }

      const newIcon = (
        <Card.Img src={url} style={{ width: '100px' }} />
      )

      // Add the JSX for the icon to the token object.
      token.icon = newIcon

      // Replace the auto-generated icon with the one specified in the mutable data.
      this.setState({
        // icon: newIcon,
        token,
        shouldCheckIcon: false
      })
    }
  }

  render () {
    const defaultIcon = (<Jdenticon size='100' value={this.state.token.tokenId} />)

    return (
      <>
        <Col xs={12} sm={6} lg={4} style={{ padding: '25px' }}>
          <Card>
            <Card.Body style={{ textAlign: 'center' }}>
              {
                this.state.token.icon
                  ? this.state.token.icon
                  : defaultIcon
              }
              <Card.Title style={{ textAlign: 'center' }}>
                <h4>{this.state.token.ticker}</h4>
              </Card.Title>

              <Container>
                <Row>
                  <Col>
                    {this.state.token.name}
                  </Col>
                </Row>
                <br />

                <Row>
                  <Col>Balance:</Col>
                  <Col>{this.state.token.qty}</Col>
                </Row>
                <br />

                <Row>
                  <Col>
                    <InfoButton token={this.state.token} />
                  </Col>
                  <Col>
                    <SendTokenButton
                      token={this.state.token}
                      appData={this.state.appData}
                      refreshTokens={this.state.refreshTokens}
                    />
                  </Col>
                </Row>
              </Container>
            </Card.Body>
          </Card>
        </Col>
      </>
    )
  }
}

export default TokenCard
