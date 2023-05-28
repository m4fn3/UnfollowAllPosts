import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React, Toasts} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import Settings from "./components/Settings"
import {getStoreByName, patchActionSheet} from "../../hook"
import {getByProps} from "enmity/modules"
import {findInReactTree} from "enmity/utilities"
import {FormRow} from "enmity/components"
import {getIDByName} from "enmity/api/assets"

const Patcher = create('UnfollowPosts')

const ActiveJoinedThreadsStore = getStoreByName("ActiveJoinedThreadsStore")
const ThreadActions = getByProps("leaveThread")
const LazyActionSheet = getByProps("openLazy", "hideActionSheet")

const UnfollowIcon = getIDByName("ic_remove_user")
const CheckIcon = getIDByName('ic_check_24px')

const UnfollowPosts: Plugin = {
    ...manifest,
    onStart() {
        patchActionSheet(Patcher, "ChannelLongPress", (args, res) => {
            Patcher.after(res, "type", (self, args, res) => {
                let guildId = args[0].channel.guild_id
                let channelId = args[0].channel.id
                let isForum = args[0].channel.type === 15
                const finalLocation = findInReactTree(res, r => r?.key === "channel-actions")
                if (!finalLocation) return
                // NOTE: hookAllEvent(対象のStore予想) -> findStore(methodName調べる) -> hook(args特定)
                let posts = ActiveJoinedThreadsStore.getActiveJoinedRelevantThreadsForParent(guildId, channelId)
                if (Object.keys(posts).length) {
                    const button = <FormRow
                        label={`Unfollow all ${isForum ? "posts" : "threads"}`}
                        leading={<FormRow.Icon source={UnfollowIcon}/>}
                        onPress={() => {
                            LazyActionSheet.hideActionSheet()
                            Object.keys(posts).forEach((postId) => {
                                let post = posts[postId]
                                // NOTE: 名前予想 -> getByProp(args特定)
                                ThreadActions.leaveThread(post.channel, "Context Menu")
                            })
                            Toasts.open({
                                content: `Unfollowed ${Object.keys(posts).length} ${isForum ? "posts" : "threads"}!`,
                                source: CheckIcon
                            })
                        }}
                    />
                    finalLocation.props.children.push(button)
                }
            })
        })
    },
    onStop() {
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(UnfollowPosts)
