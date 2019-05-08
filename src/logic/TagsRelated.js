import db from './db'
import sql from '../logic/sql'

class TagsRelatedLogic {
    
    constructor() {
    }

    getTags = async activity => {
        let tags = []
        return new Promise( (res, rej) => {

            tagsSQL = activity ? sql.activityTags.join(' ') : sql.tags
            params = activity ? [activity.activityId] : []
            console.log(tagsSQL)
            db.run(tagsSQL, params).then( result => {
                var len = result.rows.length;
                for (let i = 0; i < len; i++) {
                    let row = result.rows.item(i);
                    tags.push({ key: row.tagName, id: row.tagId })
                }
                res({ tags, success: true }) 
            }).catch( err => rej({ err, success: false }) )
        })
    }

}

export default new TagsRelatedLogic()