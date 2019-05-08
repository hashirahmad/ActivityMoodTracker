import React from 'react'
import {FlatList} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export default class FlatlistEmpty extends React.Component {

    constructor() {
        super()
        this.state = {
            activities = [],
        }
    }

    render() {

        <KeyboardAwareScrollView>
            <FlatList data={this.state.activities}>
                
            </FlatList>
        </KeyboardAwareScrollView>

    }

}