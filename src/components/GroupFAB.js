import React from 'react';
import {StyleSheet,} from 'react-native';
import {FAB, Portal,} from 'react-native-paper'

const GroupFAB = (props) => {
    return (
        <Portal>
            <FAB.Group
                open={this.state.open}
                icon={this.state.open ? 'expand-more' : 'more-horiz'}
                actions={props.actions}
                onStateChange={({ open }) => this.setState({ open })}
                style={styles.addGroupFab}
                onPress={() => {
                    if (this.state.open) {
                        props.onPress()
                    }
                }}
            />
        </Portal>
    )
}

const styles = StyleSheet.create({
    addGroupFab: {
        position: 'absolute',
        marginBottom: 50,
        right: 0,
        bottom: 0,
    }
});

export { GroupFAB };