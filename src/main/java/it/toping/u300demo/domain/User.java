package it.toping.u300demo.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import javax.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "U300_USER")
public class User {

    @Id
    @GeneratedValue
    private Long id;

    private String userName;
    private String teamName;
    private String phoneNum;

    @Version
    @JsonIgnore
    Long version;

    private User() {}

    public User(String userName, String teamName, String phoneNum){
        this.userName = userName;
        this.teamName = teamName;
        this.phoneNum = phoneNum;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) &&
                Objects.equals(userName, user.userName) &&
                Objects.equals(teamName, user.teamName) &&
                Objects.equals(phoneNum, user.phoneNum) &&
                Objects.equals(version, user.version);
    }

    @Override
    public int hashCode(){
        return Objects.hash(id, userName, teamName, phoneNum);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getPhoneNum() {
        return phoneNum;
    }

    public void setPhoneNum(String phoneNum) {
        this.phoneNum = phoneNum;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", userName='" + userName + '\'' +
                ", teamName='" + teamName + '\'' +
                ", phoneNum='" + phoneNum + '\'' +
                ", version=" + version +
                '}';
    }
}
