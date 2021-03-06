import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Button, TouchableOpacity ,ScrollView, Text, StyleSheet } from 'react-native';
import Numeral from 'numeral'

import Dialog from 'react-native-dialog';
import CoinMarketDataAction from '../Actions/CoinMarketDataAction'
import CoinListItem from './CoinListItem'
import Portfolio from './Portfolio'
//import { AsyncStorage } from '@react-native-community/async-storage';
import PortfolioInputAction from '../Actions/PortfolioInputAction';

//TODO: if more coins are planned to be added, make it more dynamic and maybe use a hashmap instead
var portfolioInitialState = [
  ["BTC", 0],
  ["ETH", 0]
];
const STORAGE_KEY = '@coin'

class MainContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coinMarket: null,
      coinPortfolio: null,
      dialogSender: "",
      isDialogVisible: false,
      dialogInput: null,
      portfolioBalance: 0
    };
  }

  componentDidMount() {
    this.setState({ coinMarket: this.props.FetchCryptoData(), portfolioBalance: this.calculatePortfolio() });
  }

  renderPortfolio() {
    var portfolio = <Portfolio total_balance={this.state.portfolioBalance} />
    return portfolio;
  }

  renderCoinListItems() {
    const { coinMarket } = this.props;
    var coinListItem = coinMarket.data.data?.map(coin =>
      <CoinListItem
        key={coin.name}
        coin_name={coin.name}
        symbol={coin.symbol}
        price_usd={Numeral(coin.quote?.USD?.price).format('0.00')}
        total_balance={Numeral(coin.quote?.USD?.price * this.getBalance(coin.symbol)).format('0.00')}
        coin_count={this.getBalance(coin.symbol)}
        price_change_24h={Numeral(coin.quote?.USD?.percent_change_24h).format('0.00')}
        parent={this}
      />
    )
    return coinListItem;
  }

  render() {
    const { coinMarket } = this.props;

    //TODO: Some kind of loading indicator
    if (coinMarket.meta.isLoading) {
      return (
        <View >
          <View>
            {this.renderPortfolio()}
          </View>
        </View>
      )
    }

    return (
      <View>
        {this.renderPortfolio()}
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.renderCoinListItems()}
        </ScrollView>
        <View style={styles.centeredContainer}>
        <TouchableOpacity
          onPress={this.handleUpdate}
          style={styles.roundedButton}>
          <Text style={styles.buttonText}>UPDATE</Text>
        </TouchableOpacity>
      </View>
        <View>
          <Dialog.Container visible={this.state.isDialogVisible}>
            <Dialog.Title>Coin Balance</Dialog.Title>
            <Dialog.Description>
              Enter your current balance.
            </Dialog.Description>
            <Dialog.Input onChangeText={(input) => this.setState({ dialogInput: input })} />
            <Dialog.Button label="Cancel" onPress={() => this.setState({ isDialogVisible: false })} />
            <Dialog.Button label="Update" onPress={() => {
              this.setState({ isDialogVisible: false, });
              this.updatePortfolio();
            }} />
          </Dialog.Container>
        </View>
      </View>
    );
  }

  //input dialog handle
  updatePortfolio = async () => {
    const { coinPortfolio } = this.props;
    var portfolioTemp = coinPortfolio;

    if (portfolioTemp == null || portfolioTemp.length == 0) //use default values if store is empty
      portfolioTemp = portfolioInitialState;

    //persist data
    //TODO: make dynamic, fix storage problems
    //this.saveData(this.state.coinPortfolio[0]); //BTC
    //this.saveData(this.state.coinPortfolio[1]); //ETH

    //dispatch
    this.props.HandlePortfolioInput(portfolioTemp, this.state.dialogSender, this.state.dialogInput);

    //set state for redraw
    this.setState({
      //coinPortfolio,
      portfolioBalance: this.calculatePortfolio()
    });
  }

  //update button handle
  handleUpdate = async () => {
    this.setState({ coinMarket: this.props.FetchCryptoData(), portfolioBalance: this.calculatePortfolio() });
  }

  //async storage
  /* saveData = async (coin) => {
     try {
       await AsyncStorage.setItem(STORAGE_KEY, coin)
       alert('Data successfully saved')
     } catch (e) {
       alert('Failed to save the data to the storage')
     }
   }*/

  //return the current balance for specified coin symbol
  getBalance = (coin) => {
    const { coinPortfolio } = this.props;

    if (coinPortfolio == null)
      return 0;

    for (let c of coinPortfolio) {
      if (c[0] === coin) //if coin tag match
        return c[1] // return coin value
    };
    return 0;
  }

  //return the current balance for all coins accumulated
  calculatePortfolio() {
    const { coinMarket } = this.props;
    const { coinPortfolio } = this.props;
    var balance = 0;

    if (coinPortfolio == null || coinMarket == null)
      return balance;

    for (let element of coinPortfolio) {
      for (let coin of coinMarket.data.data) {
        if (coin.symbol === element[0]) {
          balance += coin.quote?.USD?.price * element[1];
          break;
        }
      };
    };
    return balance;
  }
}

const styles = {
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: 50,
    paddingTop: 50
  },
  roundedButton: {
    width: 120,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 40,
    backgroundColor: '#00BCD4',
  },
  buttonText: {    
    fontWeight: 'bold',
    color: 'white'
  },
}

function mapStateToProps(state) {
  return {
    coinMarket: state.coinMarket,
    coinPortfolio: state.coinPortfolio.coinPortfolio
  }
}

export default connect(mapStateToProps, { FetchCryptoData: CoinMarketDataAction, HandlePortfolioInput: PortfolioInputAction })(MainContainer);