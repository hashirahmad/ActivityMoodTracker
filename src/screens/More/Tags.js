import React from 'react'
import {FlatList, SafeAreaView, StyleSheet, View} from 'react-native'
import {Chip, FAB, Snackbar, TextInput} from 'react-native-paper';

import db from '../../logic/db'
import TagsLogic from '../../logic/TagsRelated'

const DB = new db()
const tagsLogic = new TagsLogic()

export default class Tags extends React.Component {

    constructor() {
        super()
        this.state = {
            tagName: '',
            tags: [],
            snackBarMessage: '',
            snackBarVisible: false
        }
        this.tags = [{ key: 'Sample tag', id: 1 }]
    }

    addTag = () => {
        if ( this.state.tagName === '' ||
             this.tags.find( obj => obj.key === this.state.tagName) !== undefined ) {
            Alert.alert('Tag name cannot be left empty or be a duplicate')
            return
        }

        DB.run(DB.db, "INSERT INTO 'Tag' (tagName) VALUES (?)", [this.state.tagName]).then( result => {
            if (result.rowsAffected > 0) {
                this.tags.push({ key: this.state.tagName })
                this.setState({
                    snackBarMessage: 'Tag added susccessfully.',
                    snackBarVisible: true,
                    tagName: '',
                    tags: this.tags
                })
            } else {
                this.setState({
                    snackBarMessage: 'Tag not added successfully. Please try again.',
                    snackBarVisible: true,
                })
            }
        })
    }

    getCurrentTags = () => {
        tagsLogic.getTags().then( result => {
            this.setState({ tags: result.tags })
        }).catch( err => {
            console.log(err, '<<<< error happened')
            this.setState({
                snackBarMessage: 'There was an error with retriving of tags',
                snackBarVisible: true,
            })
        })
    }

    deleteTag = tag => {
        console.log('You pressed me', tag)
        DB.run(DB.db, "Delete from 'Tag' where tagId=?", [tag.id]).then( result => {
            if (result.rowsAffected > 0) {
                this.tags = this.tags.filter( aTag => { return aTag.key != tag.key })
                console.log(tag, this.tags)
                this.setState({
                    snackBarMessage: 'Tag deleted susccessfully.',
                    snackBarVisible: true,
                    tagName: '',
                    tags: this.tags
                })
            } else {
                this.setState({
                    snackBarMessage: 'Tag not added successfully. Please try again.',
                    snackBarVisible: true,
                })
            }
        })
    }

    showTags = ({item}) => (
        <Chip onClose={() => this.deleteTag(item)} style={{marginBottom: 10}}>
            {item.key}
        </Chip>
    );

    componentDidMount = async () => {
        try {
            if (DB.db == null) DB.db = await DB.open()
            this.getCurrentTags()
        } catch( err )  {
            console.log('database failed to open', err)
        }
    }

    onChangeText = (key, value) => {
        this.setState({
            [key]: value
        })
    }

    render() {
        return (
            <SafeAreaView style={{flex: 1}}>
                <View style={{flex: 0.15}}>
                    <View style={{ flexDirection: 'row', flex: 1}}>
                        <TextInput
                            label='Add Tag'
                            value={this.state.tagName}
                            onChangeText={ val => this.onChangeText('tagName', val)}
                            style={{ margin: 20, flex: 0.85 }}
                        />
                        <FAB
                            large
                            icon="add"
                            onPress={this.addTag}
                            style={styles.addGroupFab}
                        />
                    </View>
                </View>
                <View style={{flex: 0.85}}>
                    <FlatList
                        renderItem={this.showTags}
                        data={this.state.tags}
                        contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly'}}
                    />
                    <Snackbar
                        visible={this.state.snackBarVisible}
                        onDismiss={() => this.setState({ snackBarVisible: false })}
                    >
                        {this.state.snackBarMessage}
                    </Snackbar>
                </View>
            </SafeAreaView>
        );
    }
}

const styles =  StyleSheet.create({
    addGroupFab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        flex: 0.20
    }
})