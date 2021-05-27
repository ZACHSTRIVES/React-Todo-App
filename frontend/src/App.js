import { Container, Typography, AppBar, Toolbar, makeStyles, Button, Avatar } from '@material-ui/core';
import TodoList from './components/TodoList';
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Logout from './components/Logout-Button'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

function App() {
  const { user } = useAuth0();
  const classes = useStyles();


  return (
    <>
      {console.log(user)}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Super Todo
    </Typography>
          <Logout >Logout</Logout>
          
          <Avatar src={user.picture} />
        </Toolbar>
      </AppBar>
      <Container fixed>
        <Toolbar />
        <main className={classes.main}>
          <TodoList />
        </main>
      </Container>
    </>
  );
}

export default withAuthenticationRequired(App, {
  onRedirecting: () => <></>,
});