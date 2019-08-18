'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const when = require('when');

const follow = require('./follow');

const stompClient = require('./websocket-listener');

const root = '/api';


class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {users: [], attributes: [], page: 1, pageSize: 2, links: {}
        , loggedInManager: this.props.loggedInManager};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'users', params: {size: pageSize}}]
        ).then(userCollection => {
            return client({
                method: 'GET',
                path: userCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                /**
                 * Filter unneeded JSON Schema properties, like uri references and
                 * subtypes ($ref).
                 */
                Object.keys(schema.entity.properties).forEach(function (property) {
                    if (schema.entity.properties[property].hasOwnProperty('format') &&
                        schema.entity.properties[property].format === 'uri') {
                        delete schema.entity.properties[property];
                    }
                    else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
                        delete schema.entity.properties[property];
                    }
                });

                this.schema = schema.entity;
                this.links = userCollection.entity._links;
                return userCollection;
            });
        }).then(userCollection => {
            this.page = userCollection.entity.page;
            return userCollection.entity._embedded.users.map(user =>
                client({
                    method: 'GET',
                    path: user._links.self.href
                })
            );
        }).then(userPromises => {
            return when.all(userPromises);
        }).done(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    onCreate(newUser){
        follow(client, root, ['users']).done(response => {
                client({
                        method: 'POST',
                    path: response.entity._links.self.href,
                    entity: newUser,
                    headers: {'Content-Type' : 'application/json'}
                })
        })
    }

    onUpdate(user, updateUser){
        if(user.entity.manager.name === this.state.loggedInManager){
            updateUser["manager"] = user.entity.manager;
            client({
                method: 'PUT',
                path: user.entity._links.self.href,
                entity: updateUser,
                headers:{
                    'Content-Type': 'application/json',
                    'If-Match': user.headers.Etag
                }
            }).done(response => {
                /* Let the websocket handler update the state */
            }, response => {
                if (response.status.code === 403){
                    alert('ACCESS DENIED: 수정 권한이 없습니다.' + user.entity._links.self.href);
                }
                if (response.status.code === 412){
                    alert('DENIED: 수정이 불가능합니다.' + user.entity._links.self.href);
                }
            });
        } else {
            alert("수정 권한을 갖고 계시지 않습니다.")
        }
    }

    onDelete(user){
        client({method:'DELETE', path: user._links.self.href}
        ).done(response =>{/* let the websocket handle updating the UI */},
        response => {
            if (response.status.code === 403){
                alert('ACCESS DENIED : 삭제 권한을 갖고 있지 않습니다.' + user.entity._links.self.href);
            }
        });
    }

    onNavigate(navUri){
        client({
            method: 'GET',
            path: navUri
        }).then(userCollection => {
            this.links = userCollection.entity._links;
            this.page  = userCollection.entity.page;

            return userCollection.entity._embedded.users.map(user =>
                client({
                    method: 'GET',
                    path: user._links.self.href
                })
            );
        }).then(userPromises => {
            return when.all(userPromises);
        }).done(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.key(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    refreshAndGoToLastPage(message){
        follow(client, root, [{
                rel: 'users',
                param: {size: this.state.pageSize}
        }]).done(response => {
            if(response.entity._links.last !== undefined){
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message){
        follow(client, root, [{
                rel: 'users',
                params: {
                        size: this.state.pageSize,
                        page: this.state.page.number
                }
        }]).then(userCollection => {
            this.links = userCollection.entity._links;
            this.page  = userCollection.entity.page;

            return userCollection.entity._embedded.users.map(user => {
                return client({
                        method: 'GET',
                        path  : user._links.self.href
                })
            });
        }).then(userPromises => {
            return when.all(userPromises);
        }).then(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newUser', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateUser', callback: this.refreshCurrentPage},
            {route: '/topic/deleteUser', callback: this.refreshCurrentPage}
        ])
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <UserList     users={this.state.users}
                              links={this.state.links}
                              pageSize={this.state.pageSize}
                              attributes={this.state.attributes}
                              onNavigate={this.onNavigate}
                              onUpdate={this.onUpdate}
                              onDelete={this.onDelete}
                              updatePageSize={this.updatePageSize}
                              loggedInManager={this.state.loggedInManager}/>
            </div>
        )
    }
}

class UpdateDialog extends React.Component{
    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e){
        e.preventDefault();
        const updateUser = {};
        this.props.attributes.forEach(attribute => {
            updateUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.user, updateUser);
        window.location = "#";
    }

    render(){
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.user.entity[attribute]}>
                <input type="text" placeholder={attribute}
                                   defaultValue={this.props.user.entity[attribute]}
                                   ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updateUser-" + this.props.user.entity._links.self.href;

        const isManagerCorrect = this.props.user.entity.manager.name == this.props.loggedInManager;

        if (isManagerCorrect === false){
            return (
                <div>
                    <a>접근 권한이 없습니다.</a>
                </div>
            )
        } else {
            return(
                <div>
                    <a href={"#" + dialogId}>Update</a>
                    <div id={dialogId} className="modalDialog">
                        <div>
                            <a href="#" title="Close" className="close">X</a>
                            <h2>Update an User</h2>
                            <form>
                                {inputs}
                                <button onClick={this.handleSubmit}>Update</button>
                            </form>
                        </div>
                    </div>
                </div>
            )
        }
    }
}


class CreateDialog extends React.Component{

    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e){
        e.preventDefault();
        const newUser = {};
        this.props.attributes.forEach(attribute => {
            newUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newUser);
        
        // clear out the dialog's input
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });
        
        // Navigate away from the dialog to hide it
        window.location = "#";
    }
    
    render(){
        const inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
            </p>
        );

        return (
            <div>
                <a href="#createUser">Create</a>
                <div id="createUser" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>
                        <h2>Create new User</h2>
                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}


class UserList extends React.Component{

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }
    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }
    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }
    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        const pageInfo = this.props.hasOwnProperty("number") ?
            <h3>User - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        const users = this.props.users.map(user =>
            <User key={user.entity._links.self.href}
                  user={user}
                  attributes={this.props.attributes}
                  onUpdate={this.props.onUpdate}
                  onDelete={this.props.onDelete}
                  loggedInManager={this.props.loggedInManager}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <table>
                    <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                    <tbody>
                    <tr>
                        <th>사용자 명</th>
                        <th>팀 명</th>
                        <th>핸드폰 번호</th>
                        <th></th>
                        <th></th>
                    </tr>
                    {users}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class User extends React.Component{

    constructor(props){
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete(){
        this.props.onDelete(this.props.user);
    }

    render() {
        return (
            <tr>
                <td>{this.props.user.entity.userName}</td>
                <td>{this.props.user.entity.teamName}</td>
                <td>{this.props.user.entity.phoneNum}</td>
                <td>{this.props.user.entity.manager.name}</td>
                <td>
                    <UpdateDialog user={this.props.user}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}
                                  loggedInManager={this.props.loggedInManager}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}

</tr>
)
}
}

ReactDOM.render(
ReactDOM.render(
    <App loggedInManager={document.getElementById('managername').innerHTML} />,
    document.getElementById('react')
)